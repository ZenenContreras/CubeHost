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

async function deployDockerfile(projectId, repoUrl, internalPort) {
  const repoPath = await cloneRepo(repoUrl, projectId);
  const imageName = `cubehost-${projectId}`;
  const containerName = `cubehost-${projectId}`;

  // Build image from Dockerfile in repo root
  const tarStream = tar.pack(repoPath);
  await docker.buildImage(tarStream, imageName);

  const containerId = await docker.runContainer(imageName, containerName, internalPort);
  return { containerId, containerName };
}

async function deployCompose(projectId, repoUrl, internalPort) {
  const repoPath = await cloneRepo(repoUrl, projectId);
  const projectName = `cubehost-${projectId}`;

  // Bring up compose with the cubehost network
  execSync(
    `docker compose -p ${projectName} up -d --build`,
    {
      cwd: repoPath,
      env: {
        ...process.env,
        COMPOSE_PROJECT_NAME: projectName,
      },
      stdio: 'pipe',
      timeout: 120_000,
    }
  );

  // Find the first container from this compose project
  const { execSync: exec } = require('child_process');
  const output = exec(
    `docker compose -p ${projectName} ps -q`,
    { cwd: repoPath, encoding: 'utf8' }
  ).trim();

  const containerId = output.split('\n')[0];
  if (!containerId) throw new Error('No se encontró ningún contenedor del compose');

  // Connect the main container to cubehost-network so the proxy can reach it
  execSync(`docker network connect ${config.network} ${containerId}`, { stdio: 'pipe' });

  const containerName = `${projectName}-app-1`; // compose naming convention
  return { containerId, containerName };
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
