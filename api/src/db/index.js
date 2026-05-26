const Database = require('better-sqlite3');
const config = require('../config');

let db;

function getDb() {
  if (!db) {
    db = new Database(config.dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      roble_user_id  TEXT    NOT NULL,
      username       TEXT    NOT NULL,
      name           TEXT    NOT NULL,
      repo_url       TEXT    NOT NULL,
      container_type TEXT    NOT NULL CHECK(container_type IN ('dockerfile', 'compose')),
      port           INTEGER NOT NULL,
      container_id   TEXT,
      status         TEXT    NOT NULL DEFAULT 'pending'
                             CHECK(status IN ('pending','building','running','stopped','error')),
      created_at     TEXT    DEFAULT (datetime('now')),
      updated_at     TEXT    DEFAULT (datetime('now')),
      UNIQUE(roble_user_id, name)
    );

    CREATE TRIGGER IF NOT EXISTS projects_updated_at
    AFTER UPDATE ON projects
    BEGIN
      UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
}

module.exports = { getDb };
