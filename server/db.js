const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'fruit-match.db');

let db = null;
let dbReady = null;

/** Returns a promise that resolves with the sql.js database instance */
function getDb() {
  if (dbReady) return dbReady;

  dbReady = (async () => {
    const SQL = await initSqlJs();

    // Load existing db file or start fresh
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run('PRAGMA foreign_keys = ON');
    initSchema();
    return db;
  })();

  return dbReady;
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS game_saves (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL UNIQUE,
      board_json  TEXT    NOT NULL,
      score       INTEGER NOT NULL DEFAULT 0,
      moves       INTEGER NOT NULL DEFAULT 0,
      combo       INTEGER NOT NULL DEFAULT 0,
      best_combo  INTEGER NOT NULL DEFAULT 0,
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      score       INTEGER NOT NULL,
      moves       INTEGER NOT NULL,
      best_combo  INTEGER NOT NULL,
      played_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_lb_score ON leaderboard(score DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_lb_combo ON leaderboard(best_combo DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_lb_user  ON leaderboard(user_id)');

  saveToDisk();
}

/** Persist in-memory db to disk */
function saveToDisk() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

module.exports = { getDb, saveToDisk };