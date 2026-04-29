const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
  max: 5,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 8000,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error:", err.message);
});

async function bootstrap() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT DEFAULT '',
        calendar_embed TEXT DEFAULT '',
        music_urls TEXT DEFAULT '[]',
        radio_sync_enabled INTEGER DEFAULT 0,
        radio_focus_slot INTEGER DEFAULT 0,
        radio_break_slot INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
        ON users (LOWER(username))
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT DEFAULT '',
        difficulty TEXT DEFAULT 'Easy',
        status TEXT DEFAULT 'Not Started',
        due_date TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        done INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, position, id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_done ON tasks(user_id, done)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pomodoro_state (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        data TEXT NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    client.release();
  }
}

bootstrap().catch((err) => {
  console.error("[db] Schema bootstrap failed:", err.message);
});

module.exports = pool;
