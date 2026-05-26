const cron = require('node-cron');
const config = require('./config');
const { containers } = require('./db');
const docker = require('./docker');

function start() {
  // Check for inactive containers every minute
  cron.schedule('* * * * *', async () => {
    const cutoff = new Date(Date.now() - config.inactivityMs).toISOString().replace('T', ' ').slice(0, 19);
    const inactive = containers.findInactive(cutoff);

    for (const record of inactive) {
      console.log(`[monitor] Stopping inactive container: ${record.subdomain} (idle since ${record.last_activity})`);
      try {
        await docker.stopContainer(record.container_id);
        containers.updateStatus(record.container_id, 'stopped');
        console.log(`[monitor] Stopped: ${record.subdomain}`);
      } catch (err) {
        console.error(`[monitor] Failed to stop ${record.subdomain}: ${err.message}`);
      }
    }
  });

  console.log(`[monitor] Inactivity monitor started (timeout: ${config.inactivityMs / 60_000} min)`);
}

module.exports = { start };
