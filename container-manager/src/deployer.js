const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const tar = require('tar-fs');
const simpleGit = require('simple-git');
const config = require('./config');
const docker = require('./docker');

async function cloneRepo(repoUrl, projectId) {
  const dest = path.join(config.workDir, String(projectId));
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  await simpleGit().clone(repoUrl, dest, ['--depth', '1']);
  return dest;
}

function sanitizeComposeFile(repoPath) {
  const filenames = ['docker-compose.yml', 'docker-compose.yaml'];
  for (const filename of filenames) {
    const filePath = path.join(repoPath, filename);
    if (fs.existsSync(filePath)) {
      console.log(`[deploy] Sanitizing ${filename} to comment out local volume mounts...`);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const sanitizedLines = lines.map(line => {
        const trimmed = line.trim();
        // Comentar montajes de volumen relativos (ej. "- .:/app")
        if (
          trimmed.startsWith('- .') || 
          trimmed.startsWith('-.') || 
          trimmed.startsWith('- "./.') || 
          trimmed.startsWith("- './.")
        ) {
          console.log(`[deploy] Commented out relative volume mount in compose: ${trimmed}`);
          return line.replace('-', '# -');
        }
        return line;
      });
      fs.writeFileSync(filePath, sanitizedLines.join('\n'), 'utf8');
    }
  }
}

async function deployDockerfile(projectId, repoUrl, internalPort) {
  const repoPath = await cloneRepo(repoUrl, projectId);
  const imageName = `cubehost-${projectId}`;
  const containerName = `cubehost-${projectId}`;

  // Build image from Dockerfile in repo root
  const tarStream = tar.pack(repoPath);
  await docker.buildImage(tarStream, imageName);

  const containerId = await docker.runContainer(imageName, containerName, internalPort);

  // Obtener la IP del contenedor en cubehost-network
  const info = await docker.inspectContainer(containerId);
  const containerIp = info.NetworkSettings.Networks[config.network]?.IPAddress || null;
  console.log(`[deploy] Dockerfile container IP on ${config.network}: ${containerIp}`);

  return { containerId, containerName, containerIp };
}

async function deployCompose(projectId, repoUrl, internalPort) {
  const repoPath = await cloneRepo(repoUrl, projectId);
  
  // Limpiar montajes de volúmenes locales antes de desplegar
  sanitizeComposeFile(repoPath);

  const projectName = `cubehost-${projectId}`;

  // Limpiar cualquier despliegue previo con el mismo nombre para evitar conflictos de contenedores
  console.log(`[deploy] Removing any previous deployment for project ${projectId}...`);
  try {
    execSync(
      `docker compose -p ${projectName} down --remove-orphans`,
      { cwd: repoPath, stdio: 'pipe', timeout: 60_000 }
    );
  } catch (e) {
    console.warn(`[deploy] Could not remove previous deployment (may not exist): ${e.message.split('\n')[0]}`);
  }

  // Bring up compose with the cubehost network
  console.log(`[deploy] Starting docker compose build for project ${projectId}...`);
  execSync(
    `docker compose -p ${projectName} up -d --build`,
    {
      cwd: repoPath,
      env: {
        ...process.env,
        COMPOSE_PROJECT_NAME: projectName,
      },
      stdio: 'inherit',
      timeout: 300_000,
    }
  );

  // Obtener todos los IDs de contenedores del compose
  const { execSync: exec } = require('child_process');
  let allIds = '';
  try {
    allIds = exec(`docker compose ps -q`, { cwd: repoPath, encoding: 'utf8' }).trim();
  } catch (e) {
    console.warn(`[deploy] Fallback a nombre de proyecto explícito: ${e.message}`);
  }
  if (!allIds) {
    allIds = exec(
      `docker compose -p ${projectName} ps -q`,
      { cwd: repoPath, encoding: 'utf8' }
    ).trim();
  }

  const containerIds = allIds.split('\n').map(id => id.trim()).filter(Boolean);
  if (containerIds.length === 0) throw new Error('No se encontró ningún contenedor del compose');

  // Conectar TODOS los contenedores a cubehost-network para que sean alcanzables
  for (const id of containerIds) {
    try {
      execSync(`docker network connect ${config.network} ${id}`, { stdio: 'pipe' });
      console.log(`[deploy] Connected container ${id.slice(0, 12)} to ${config.network}`);
    } catch (e) {
      // Ignorar si ya estaba conectado
      if (!e.message.includes('already exists')) {
        console.warn(`[deploy] Could not connect ${id.slice(0, 12)}: ${e.message}`);
      }
    }
  }

  // Inspeccionar todos los contenedores para encontrar el que expone el puerto indicado
  const inspectedContainers = [];
  for (const id of containerIds) {
    const info = await docker.inspectContainer(id);
    const exposedPorts = Object.keys(info.Config?.ExposedPorts || {});
    const name = info.Name.replace(/^\//, '');
    console.log(`[deploy] Container ${name} exposes: ${exposedPorts.join(', ') || 'none'}`);
    inspectedContainers.push({ id, name, exposedPorts, info });
  }

  // Estrategia de selección:
  // 1. El que expone exactamente el puerto indicado
  // 2. Entre los que exponen ese puerto, preferir el que tiene 'frontend' en el nombre
  // 3. Fallback: el primero de la lista
  let target = null;

  const portMatches = inspectedContainers.filter(c =>
    c.exposedPorts.includes(`${internalPort}/tcp`)
  );

  if (portMatches.length > 0) {
    // Preferir el que tenga 'frontend' en el nombre
    target = portMatches.find(c => c.name.toLowerCase().includes('frontend')) || portMatches[0];
    console.log(`[deploy] Matched port ${internalPort} → ${target.name}`);
  } else {
    // Si nadie expone ese puerto, preferir el de 'frontend' o usar el primero
    target = inspectedContainers.find(c => c.name.toLowerCase().includes('frontend')) || inspectedContainers[0];
    console.warn(`[deploy] No container exposes port ${internalPort}, falling back to: ${target.name}`);
  }

  const targetContainerId = target.id;
  const targetContainerName = target.name;

  // Determinar el puerto REAL que el contenedor expone
  // Si el puerto indicado por el usuario no coincide con ninguno, usar el primero que expone el target
  let actualPort = internalPort;
  if (!target.exposedPorts.includes(`${internalPort}/tcp`) && target.exposedPorts.length > 0) {
    const firstPort = target.exposedPorts[0].replace('/tcp', '').replace('/udp', '');
    actualPort = Number(firstPort);
    console.warn(`[deploy] Port ${internalPort} not found on ${targetContainerName}, using detected port: ${actualPort}`);
  }

  // Obtener la IP real del contenedor en cubehost-network para el proxy
  const finalInspect = await docker.inspectContainer(targetContainerId);
  const containerIp = finalInspect.NetworkSettings.Networks[config.network]?.IPAddress || null;
  console.log(`[deploy] Registered proxy target: ID=${targetContainerId.slice(0, 12)}, Name=${targetContainerName}, IP=${containerIp}, Port=${actualPort}`);
  return { containerId: targetContainerId, containerName: targetContainerName, containerIp, actualPort };
}

async function deploy({ projectId, repoUrl, containerType, port }) {
  await docker.ensureNetwork();

  if (containerType === 'dockerfile') {
    return deployDockerfile(projectId, repoUrl, port);
  }
  if (containerType === 'compose') {
    return deployCompose(projectId, repoUrl, port);
  }
  throw new Error(`Tipo de contenedor desconocido: ${containerType}`);
}

module.exports = { deploy };
