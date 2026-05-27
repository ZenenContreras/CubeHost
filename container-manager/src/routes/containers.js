const { Router } = require('express');
const path = require('path');
const { execSync } = require('child_process');
const { containers } = require('../db');
const { deploy } = require('../deployer');
const docker = require('../docker');
const config = require('../config');

const router = Router();

// POST /containers/deploy
router.post('/deploy', async (req, res, next) => {
  try {
    const { projectId, repoUrl, containerType, port, subdomain } = req.body;
    if (!projectId || !repoUrl || !containerType || !port || !subdomain) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const { containerId, containerName, containerIp, actualPort } = await deploy({
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
      container_ip: containerIp || null,
      container_type: containerType,
      internal_port: actualPort || Number(port),
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
    const record = containers.findById(req.params.containerId);
    if (record && record.container_type === 'compose') {
      const repoPath = path.join(config.workDir, String(record.project_id));
      const projectName = `cubehost-${record.project_id}`;
      execSync(`docker compose -p ${projectName} stop`, { cwd: repoPath, stdio: 'pipe' });
    } else {
      await docker.stopContainer(req.params.containerId);
    }
    containers.updateStatus(req.params.containerId, 'stopped');
    res.json({ status: 'stopped' });
  } catch (err) {
    next(err);
  }
});

// POST /containers/:containerId/start
router.post('/:containerId/start', async (req, res, next) => {
  try {
    const record = containers.findById(req.params.containerId);
    if (record && record.container_type === 'compose') {
      const repoPath = path.join(config.workDir, String(record.project_id));
      const projectName = `cubehost-${record.project_id}`;
      execSync(`docker compose -p ${projectName} start`, { cwd: repoPath, stdio: 'pipe' });
    } else {
      await docker.startContainer(req.params.containerId);
    }
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
    if (record) {
      if (record.container_type === 'compose') {
        const repoPath = path.join(config.workDir, String(record.project_id));
        const projectName = `cubehost-${record.project_id}`;
        try {
          execSync(`docker compose -p ${projectName} down --remove-orphans`, { cwd: repoPath, stdio: 'pipe' });
        } catch (e) {
          console.warn(`[delete] docker compose down failed: ${e.message}`);
        }
      } else {
        await docker.removeContainer(req.params.containerId);
      }
      await docker.removeImage(`cubehost-${record.project_id}`).catch(() => {});
      containers.remove(req.params.containerId);
    } else {
      await docker.removeContainer(req.params.containerId).catch(() => {});
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
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Contenedor no encontrado en Docker' });
    }
    next(err);
  }
});

module.exports = router;
