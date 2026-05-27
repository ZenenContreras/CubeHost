const Database = require('better-sqlite3');
const config = require('./config');

let db;

function getDb() {
  if (!db) {
    db = new Database(config.dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS containers (
        project_id     INTEGER PRIMARY KEY,
        subdomain      TEXT    UNIQUE NOT NULL,
        container_id   TEXT    NOT NULL,
        container_name TEXT    NOT NULL,
        container_ip   TEXT,
        container_type TEXT    NOT NULL,
        internal_port  INTEGER NOT NULL,
        status         TEXT    NOT NULL DEFAULT 'running',
        last_activity  TEXT    DEFAULT (datetime('now'))
      );
    `);
    // Migración: añadir container_ip si no existe (compatibilidad con DB existente)
    try {
      db.exec('ALTER TABLE containers ADD COLUMN container_ip TEXT');
    } catch { /* columna ya existe */ }
  }
  return db;
}

const containers = {
  upsert(data) {
    const db = getDb();
    // Eliminar cualquier registro previo conflictivo para evitar errores de restricción UNIQUE
    db.prepare('DELETE FROM containers WHERE project_id = ? OR subdomain = ?')
      .run(data.project_id, data.subdomain);

    getDb()
      .prepare(`
        INSERT INTO containers (project_id, subdomain, container_id, container_name, container_ip, container_type, internal_port, status)
        VALUES (@project_id, @subdomain, @container_id, @container_name, @container_ip, @container_type, @internal_port, @status)
      `)
      .run(data);
  },

  findBySubdomain(subdomain) {
    return getDb()
      .prepare('SELECT * FROM containers WHERE subdomain = ?')
      .get(subdomain);
  },

  findById(containerId) {
    return getDb()
      .prepare('SELECT * FROM containers WHERE container_id = ?')
      .get(containerId);
  },

  updateStatus(containerId, status) {
    getDb()
      .prepare('UPDATE containers SET status = ? WHERE container_id = ?')
      .run(status, containerId);
  },

  touchActivity(subdomain) {
    getDb()
      .prepare("UPDATE containers SET last_activity = datetime('now') WHERE subdomain = ?")
      .run(subdomain);
  },

  // Returns containers with last_activity older than cutoff and status = 'running'
  findInactive(cutoffIso) {
    return getDb()
      .prepare(`SELECT * FROM containers WHERE status = 'running' AND last_activity < ?`)
      .all(cutoffIso);
  },

  remove(containerId) {
    getDb()
      .prepare('DELETE FROM containers WHERE container_id = ?')
      .run(containerId);
  },
};

module.exports = { getDb, containers };
