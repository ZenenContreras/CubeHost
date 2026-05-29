const Dockerode = require('dockerode');
const config = require('./config');

const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

async function ensureNetwork() {
  try {
    await docker.getNetwork(config.network).inspect();
  } catch {
    await docker.createNetwork({ Name: config.network, Driver: 'bridge' });
    console.log(`[docker] Created network: ${config.network}`);
  }
}

async function buildImage(tarStream, imageName) {
  console.log(`[docker] Starting Dockerfile build for image ${imageName}...`);
  return new Promise((resolve, reject) => {
    docker.buildImage(tarStream, { t: imageName }, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(
        stream,
        (err, output) => {
          if (err) return reject(err);
          const last = output[output.length - 1];
          if (last?.error) return reject(new Error(last.error));
          resolve(imageName);
        },
        (event) => {
          if (event.stream) {
            process.stdout.write(`[docker build] ${event.stream}`);
          }
        }
      );
    });
  });
}

async function runContainer(imageName, containerName, internalPort) {
  const cpuQuota = Math.floor(parseFloat(config.container.cpus) * 100_000);
  const memoryBytes = config.container.memoryMb * 1024 * 1024;

  const container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    ExposedPorts: { [`${internalPort}/tcp`]: {} },
    HostConfig: {
      CpuQuota: cpuQuota,
      CpuPeriod: 100_000,
      Memory: memoryBytes,
      NetworkMode: config.network,
      RestartPolicy: { Name: 'no' },
    },
    NetworkingConfig: {
      EndpointsConfig: { [config.network]: {} },
    },
  });

  await container.start();
  return container.id;
}

async function stopContainer(containerId) {
  try {
    await docker.getContainer(containerId).stop({ t: 2 });
  } catch (err) {
    if (!err.statusCode || err.statusCode !== 304) throw err; // 304 = already stopped
  }
}

async function startContainer(containerId) {
  await docker.getContainer(containerId).start();
}

async function removeContainer(containerId) {
  const container = docker.getContainer(containerId);
  try {
    await container.stop({ t: 5 });
  } catch { /* ignore if already stopped */ }
  await container.remove({ force: true });
}

async function inspectContainer(containerId) {
  return docker.getContainer(containerId).inspect();
}

async function removeImage(imageName) {
  try {
    await docker.getImage(imageName).remove({ force: true });
  } catch { /* ignore if image doesn't exist */ }
}

async function updateContainer(containerId, updateConfig) {
  return docker.getContainer(containerId).update(updateConfig);
}

module.exports = {
  client: docker,           // instancia Dockerode cruda (usada en deployer)
  ensureNetwork,
  buildImage,
  runContainer,
  stopContainer,
  startContainer,
  removeContainer,
  inspectContainer,
  removeImage,
  updateContainer,
};
