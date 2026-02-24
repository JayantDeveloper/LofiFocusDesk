require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET_KEY || "dev-secret-change-me";
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
const REMEMBER_EXPIRES_IN = process.env.JWT_REMEMBER_EXPIRES_IN || "365d";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(",").map((o) => o.trim())
      : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

// Helpers
function userJson(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name || "",
    calendar_embed: row.calendar_embed || "",
  };
}

function signToken(userId, remember) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    expiresIn: remember ? REMEMBER_EXPIRES_IN : TOKEN_EXPIRES_IN,
  });
}

function authOptional(req, _res, next) {
  const header = req.headers.authorization || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    req.userId = null;
    return next();
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
  } catch (err) {
    req.userId = null;
  }
  next();
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// Queries (prepared)
const stmtFindUserByUsername = db.prepare("SELECT * FROM users WHERE username = ?");
const stmtFindUserById = db.prepare("SELECT * FROM users WHERE id = ?");
const stmtInsertUser = db.prepare(`
  INSERT INTO users (username, password_hash, display_name, calendar_embed)
  VALUES (?, ?, ?, ?)
`);
const stmtUpdateUser = db.prepare(`
  UPDATE users SET display_name = ?, calendar_embed = ? WHERE id = ?
`);

const stmtListTasks = db.prepare(`
  SELECT id, title, difficulty, done, position FROM tasks
  WHERE user_id = ? ORDER BY position, id
`);
const stmtMaxPosition = db.prepare("SELECT COALESCE(MAX(position), 0) as maxPos FROM tasks WHERE user_id = ?");
const stmtInsertTask = db.prepare(`
  INSERT INTO tasks (user_id, title, difficulty, done, position)
  VALUES (?, ?, ?, ?, ?)
`);
const stmtFindTask = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?");
const stmtUpdateTask = db.prepare(`
  UPDATE tasks
  SET title = ?, difficulty = ?, done = ?, position = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ? AND user_id = ?
`);
const stmtDeleteTask = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?");

const stmtGetPomodoro = db.prepare("SELECT * FROM pomodoro_state WHERE user_id = ?");
const stmtInsertPomodoro = db.prepare("INSERT INTO pomodoro_state (user_id, data) VALUES (?, ?)");
const stmtUpdatePomodoro = db.prepare(`
  UPDATE pomodoro_state SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
`);

// Routes
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/auth/register", async (req, res) => {
  const { username = "", password = "", remember = false } = req.body || {};
  const trimmed = username.trim();
  if (trimmed.length < 3) return res.status(400).json({ error: "Username must be at least 3 characters" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  if (stmtFindUserByUsername.get(trimmed)) {
    return res.status(400).json({ error: "Username already exists" });
  }
  const hash = await bcrypt.hash(password, 12);
  const info = stmtInsertUser.run(trimmed, hash, trimmed, "");
  const user = stmtFindUserById.get(info.lastInsertRowid);
  const token = signToken(user.id, remember);
  res.json({ token, user: userJson(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { username = "", password = "", remember = false } = req.body || {};
  const user = stmtFindUserByUsername.get((username || "").trim());
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken(user.id, remember);
  res.json({ token, user: userJson(user) });
});

app.post("/api/auth/logout", (_req, res) => res.json({ ok: true }));

app.get("/api/auth/me", authOptional, (req, res) => {
  if (!req.userId) return res.json({ user: null });
  const user = stmtFindUserById.get(req.userId);
  res.json({ user: userJson(user) });
});

app.get("/api/user", authRequired, (req, res) => {
  const user = stmtFindUserById.get(req.userId);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user: userJson(user) });
});

app.put("/api/user", authRequired, (req, res) => {
  const user = stmtFindUserById.get(req.userId);
  if (!user) return res.status(404).json({ error: "Not found" });
  const display = (req.body?.display_name || "").trim();
  const calendar = req.body?.calendar_embed || "";
  stmtUpdateUser.run(display, calendar, req.userId);
  const updated = stmtFindUserById.get(req.userId);
  res.json({ user: userJson(updated) });
});

app.get("/api/tasks", authRequired, (req, res) => {
  const tasks = stmtListTasks.all(req.userId).map((t) => ({
    ...t,
    done: !!t.done,
  }));
  res.json({ tasks });
});

app.post("/api/tasks", authRequired, (req, res) => {
  const title = (req.body?.title || "").trim();
  const difficulty = ["Easy", "Medium", "Hard"].includes(req.body?.difficulty) ? req.body.difficulty : "Easy";
  const done = req.body?.done === true ? 1 : 0;
  const maxPos = stmtMaxPosition.get(req.userId).maxPos || 0;
  const info = stmtInsertTask.run(req.userId, title, difficulty, done, maxPos + 1);
  const task = stmtFindTask.get(info.lastInsertRowid, req.userId);
  res.status(201).json({
    task: {
      id: task.id,
      title: task.title,
      difficulty: task.difficulty,
      done: !!task.done,
      position: task.position,
    },
  });
});

app.patch("/api/tasks/:id", authRequired, (req, res) => {
  const task = stmtFindTask.get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: "Not found" });
  const title = req.body.hasOwnProperty("title") ? (req.body.title || "").trim() : task.title;
  const difficulty = req.body.hasOwnProperty("difficulty") && ["Easy", "Medium", "Hard"].includes(req.body.difficulty)
    ? req.body.difficulty
    : task.difficulty;
  const done = req.body.hasOwnProperty("done") ? (req.body.done ? 1 : 0) : task.done;
  const position = req.body.hasOwnProperty("position") && Number.isInteger(req.body.position)
    ? req.body.position
    : task.position;

  stmtUpdateTask.run(title, difficulty, done, position, task.id, req.userId);
  const updated = stmtFindTask.get(task.id, req.userId);
  res.json({
    task: {
      id: updated.id,
      title: updated.title,
      difficulty: updated.difficulty,
      done: !!updated.done,
      position: updated.position,
    },
  });
});

app.delete("/api/tasks/:id", authRequired, (req, res) => {
  const task = stmtFindTask.get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: "Not found" });
  stmtDeleteTask.run(task.id, req.userId);
  res.json({ ok: true });
});

app.get("/api/pomodoro", authRequired, (req, res) => {
  const row = stmtGetPomodoro.get(req.userId);
  const data = row ? JSON.parse(row.data || "{}") : {};
  res.json({ state: data });
});

app.put("/api/pomodoro", authRequired, (req, res) => {
  const payload = req.body || {};
  const existing = stmtGetPomodoro.get(req.userId);
  if (existing) {
    stmtUpdatePomodoro.run(JSON.stringify(payload), req.userId);
  } else {
    stmtInsertPomodoro.run(req.userId, JSON.stringify(payload));
  }
  res.json({ state: payload });
});

// Fallback error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`FocusDesk Express API listening on port ${PORT}`);
});
