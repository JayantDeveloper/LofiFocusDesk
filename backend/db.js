const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const Database = require("better-sqlite3");

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, ".env.local"), override: true });

const configuredDbPath = (process.env.SQLITE_DB_PATH || "").trim();
const dbPath = configuredDbPath
  ? (path.isAbsolute(configuredDbPath) ? configuredDbPath : path.join(__dirname, configuredDbPath))
  : path.join(__dirname, "instance", "focusdesk.db");
const dbDir = path.dirname(dbPath);
fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Schema bootstrap (idempotent)
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  calendar_embed TEXT DEFAULT '',
  music_urls TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT DEFAULT '',
  difficulty TEXT DEFAULT 'Easy' CHECK (difficulty IN ('Easy','Medium','Hard')),
  done INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pomodoro_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, position, id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_done ON tasks(user_id, done);
`);

const userColumns = new Set(
  db.prepare("PRAGMA table_info(users)").all().map((column) => column.name),
);
if (!userColumns.has("music_urls")) {
  db.exec("ALTER TABLE users ADD COLUMN music_urls TEXT DEFAULT '[]'");
}

module.exports = db;
