const { getDb } = require('../db');
const containerService = require('../services/containerService');

// Deriva un username limpio del email de Roble: "juan.perez@uninorte.edu.co" → "juan.perez"
function usernameFromUser(user) {
  return (user.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9.-]/g, '');
}

function list(req, res) {
  const projects = getDb()
    .prepare('SELECT * FROM projects WHERE roble_user_id = ? ORDER BY created_at DESC')
    .all(String(req.user.id || req.user._id));
  res.json(projects);
}

function getOne(req, res) {
  const project = getDb()
    .prepare('SELECT * FROM projects WHERE id = ? AND roble_user_id = ?')
    .get(Number(req.params.id), String(req.user.id || req.user._id));

  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(project);
}

async function create(req, res, next) {
  try {
    const { name, repoUrl, containerType, port } = req.body;

    if (!name || !repoUrl || !containerType || !port) {
      return res.status(400).json({ error: 'name, repoUrl, containerType y port son requeridos' });
    }
    if (!['dockerfile', 'compose'].includes(containerType)) {
      return res.status(400).json({ error: 'containerType debe ser dockerfile o compose' });
    }
    if (!Number.isInteger(Number(port)) || port < 1 || port > 65535) {
      return res.status(400).json({ error: 'Puerto inválido' });
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      return res.status(400).json({ error: 'El nombre solo puede contener letras minúsculas, números y guiones' });
    }

    const robleUserId = String(req.user.id || req.user._id);
    const username = usernameFromUser(req.user);
    const db = getDb();

    const existing = db
      .prepare('SELECT id FROM projects WHERE roble_user_id = ? AND name = ?')
      .get(robleUserId, name);
    if (existing) {
      return res.status(409).json({ error: 'Ya tienes un proyecto con ese nombre' });
    }

    const result = db
      .prepare(
        `INSERT INTO projects (roble_user_id, username, name, repo_url, container_type, port, status)
         VALUES (?, ?, ?, ?, ?, ?, 'building')`
      )
      .run(robleUserId, username, name, repoUrl, containerType, Number(port));

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);

    deployInBackground(project);

    res.status(202).json({
      ...project,
      url: `http://${name}.${username}.localhost`,
    });
  } catch (err) {
    next(err);
  }
}

async function deployInBackground(project) {
  const db = getDb();
  const subdomain = `${project.name}.${project.username}`;
  try {
    const { containerId } = await containerService.deployProject({
      projectId: project.id,
      repoUrl: project.repo_url,
      containerType: project.container_type,
      port: project.port,
      subdomain,
    });
    db.prepare("UPDATE projects SET container_id = ?, status = 'running' WHERE id = ?").run(
      containerId,
      project.id
    );
  } catch (err) {
    console.error(`[deploy] project ${project.id} failed:`, err.message);
    db.prepare("UPDATE projects SET status = 'error' WHERE id = ?").run(project.id);
  }
}

async function remove(req, res, next) {
  try {
    const robleUserId = String(req.user.id || req.user._id);
    const db = getDb();
    const project = db
      .prepare('SELECT * FROM projects WHERE id = ? AND roble_user_id = ?')
      .get(Number(req.params.id), robleUserId);

    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    if (project.container_id) {
      await containerService.removeContainer(project.container_id).catch((err) =>
        console.warn(`[remove] container cleanup failed: ${err.message}`)
      );
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function start(req, res, next) {
  try {
    const robleUserId = String(req.user.id || req.user._id);
    const project = getDb()
      .prepare('SELECT * FROM projects WHERE id = ? AND roble_user_id = ?')
      .get(Number(req.params.id), robleUserId);

    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    if (!project.container_id) return res.status(400).json({ error: 'Sin contenedor asignado' });

    await containerService.startContainer(project.container_id);
    getDb().prepare("UPDATE projects SET status = 'running' WHERE id = ?").run(project.id);

    res.json({ status: 'running' });
  } catch (err) {
    next(err);
  }
}

async function stop(req, res, next) {
  try {
    const robleUserId = String(req.user.id || req.user._id);
    const project = getDb()
      .prepare('SELECT * FROM projects WHERE id = ? AND roble_user_id = ?')
      .get(Number(req.params.id), robleUserId);

    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    if (!project.container_id) return res.status(400).json({ error: 'Sin contenedor asignado' });

    await containerService.stopContainer(project.container_id);
    getDb().prepare("UPDATE projects SET status = 'stopped' WHERE id = ?").run(project.id);

    res.json({ status: 'stopped' });
  } catch (err) {
    next(err);
  }
}

async function status(req, res, next) {
  try {
    const robleUserId = String(req.user.id || req.user._id);
    const project = getDb()
      .prepare('SELECT * FROM projects WHERE id = ? AND roble_user_id = ?')
      .get(Number(req.params.id), robleUserId);

    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    if (!project.container_id) return res.json({ status: project.status, lastActivity: null });

    const info = await containerService.getContainerStatus(project.container_id);
    res.json(info);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, remove, start, stop, status };
