const { Router } = require('express');
const { containers } = require('../db');
const { deploy } = require('../deployer');
const docker = require('../docker');

const router = Router();

// POST /containers/deploy
router.post('/deploy', async (req, res, next) => {
  try {
    const { projectId, repoUrl, containerType, port, subdomain } = req.body;
    if (!projectId || !repoUrl || !containerType || !port || !subdomain) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const { containerId, containerName } = await deploy({
      projectId,
      repoUrl,
      containerType,
      port: Number(port),
    });

    containers.upsert({
      project_id: projectId,
      subdomain,
      container_id: containerId,
      container_name: containerName,
      container_type: containerType,
      internal_port: Number(port),
      status: 'running',
    });

    res.json({ containerId, status: 'running' });
  } catch (err) {
    next(err);
  }
});

// POST /containers/:containerId/stop
router.post('/:containerId/stop', async (req, res, next) => {
  try {
    await docker.stopContainer(req.params.containerId);
    containers.updateStatus(req.params.containerId, 'stopped');
    res.json({ status: 'stopped' });
  } catch (err) {
    next(err);
  }
});

// POST /containers/:containerId/start
router.post('/:containerId/start', async (req, res, next) => {
  try {
    await docker.startContainer(req.params.containerId);
    containers.updateStatus(req.params.containerId, 'running');
    res.json({ status: 'running' });
  } catch (err) {
    next(err);
  }
});

// DELETE /containers/:containerId
router.delete('/:containerId', async (req, res, next) => {
  try {
    const record = containers.findById(req.params.containerId);
    await docker.removeContainer(req.params.containerId);
    if (record) {
      await docker.removeImage(`cubehost-${record.project_id}`).catch(() => {});
      containers.remove(req.params.containerId);
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /containers/:containerId/status
router.get('/:containerId/status', async (req, res, next) => {
  try {
    const record = containers.findById(req.params.containerId);
    if (!record) return res.status(404).json({ error: 'Contenedor no registrado' });

    const info = await docker.inspectContainer(req.params.containerId);
    res.json({
      status: info.State.Running ? 'running' : 'stopped',
      lastActivity: record.last_activity,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
