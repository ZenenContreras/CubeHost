const path = require('path');
const { execSync } = require('child_process');
const config = require('./config');
const { containers } = require('./db');
const docker = require('./docker');

function start() {
  const checkInactivity = async () => {
    const cutoff = new Date(Date.now() - config.inactivityMs).toISOString().replace('T', ' ').slice(0, 19);
    const inactive = containers.findInactive(cutoff);

    for (const record of inactive) {
      console.log(`[monitor] Stopping inactive container: ${record.subdomain} (idle since ${record.last_activity})`);
      // Update DB status to stopped first so that incoming proxy requests trigger wakeContainer
      containers.updateStatus(record.container_id, 'stopped');
      try {
        if (record.container_type === 'compose') {
          const repoPath = path.join(config.workDir, String(record.project_id));
          const projectName = `cubehost-${record.project_id}`;
          execSync(`docker compose -p ${projectName} stop`, { cwd: repoPath, stdio: 'pipe' });
        } else {
          await docker.stopContainer(record.container_id);
        }
        console.log(`[monitor] Stopped: ${record.subdomain}`);
      } catch (err) {
        // Revert status to running if stop failed
        containers.updateStatus(record.container_id, 'running');
        console.error(`[monitor] Failed to stop ${record.subdomain}: ${err.message}`);
      }
    }
  };

  // Check for inactive containers at the configured interval
  const intervalMs = config.monitorIntervalMs;
  setInterval(checkInactivity, intervalMs);

  console.log(`[monitor] Inactivity monitor started (timeout: ${config.inactivityMs / 1000}s, interval: ${intervalMs / 1000}s)`);
}

module.exports = { start };
