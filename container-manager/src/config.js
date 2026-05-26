module.exports = {
  apiPort: Number(process.env.API_PORT) || 4001,
  proxyPort: Number(process.env.PROXY_PORT) || 5000,
  workDir: process.env.WORK_DIR || '/tmp/cubehost-repos',
  dbPath: process.env.DB_PATH || '/data/containers.db',
  network: process.env.DOCKER_NETWORK || 'cubehost-network',
  inactivityMs: Number(process.env.INACTIVITY_TIMEOUT_MS) || 30 * 60 * 1000,
  container: {
    cpus: process.env.CONTAINER_CPUS || '0.5',       // 0.5 CPU core
    memoryMb: Number(process.env.CONTAINER_MEMORY_MB) || 256,
  },
};
