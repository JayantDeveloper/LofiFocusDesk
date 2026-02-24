const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, ".env.local"), override: true });
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET_KEY || "dev-secret-change-me";
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
const REMEMBER_EXPIRES_IN = process.env.JWT_REMEMBER_EXPIRES_IN || "365d";
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "focusdesk_token";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE || (IS_PROD ? "none" : "lax")).toLowerCase();
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? String(process.env.COOKIE_SECURE).toLowerCase() === "true"
  : COOKIE_SAME_SITE === "none";
const MAX_MUSIC_SLOTS = 5;
const DEFAULT_MUSIC_URLS = Object.freeze([
  "https://www.youtube.com/watch?v=6Wurxv2x9cA",
  "",
  "",
  "",
  "",
]);
const DEV_FRONTEND_ORIGINS = Object.freeze([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

const app = express();

function normalizeOrigin(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
}

const configuredFrontendOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN
      .split(",")
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean)
  : [];
const allowedFrontendOrigins = IS_PROD
  ? configuredFrontendOrigins
  : Array.from(new Set([...configuredFrontendOrigins, ...DEV_FRONTEND_ORIGINS]));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedFrontendOrigins.length === 0) {
        callback(null, true);
        return;
      }
      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedFrontendOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
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
    music_urls: parseMusicUrls(row.music_urls),
  };
}

function normalizeMusicUrls(value) {
  const source = Array.isArray(value) ? value : [];
  const normalized = Array.from({ length: MAX_MUSIC_SLOTS }, (_, index) => {
    if (typeof source[index] !== "string") return "";
    return source[index].trim();
  });
  if (!normalized[0]) {
    normalized[0] = DEFAULT_MUSIC_URLS[0];
  }
  return normalized;
}

function parseMusicUrls(rawValue) {
  if (Array.isArray(rawValue)) {
    return normalizeMusicUrls(rawValue);
  }
  if (typeof rawValue === "string" && rawValue.trim()) {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return normalizeMusicUrls(parsed);
      }
    } catch {}
  }
  return normalizeMusicUrls(DEFAULT_MUSIC_URLS);
}

function serializeMusicUrls(value) {
  return JSON.stringify(parseMusicUrls(value));
}

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim() : "";
}

function signToken(userId, remember) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    expiresIn: remember ? REMEMBER_EXPIRES_IN : TOKEN_EXPIRES_IN,
  });
}

function durationToMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value * 1000;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;

  const secondsOnly = trimmed.match(/^(\d+)$/);
  if (secondsOnly) {
    return Number(secondsOnly[1]) * 1000;
  }

  const match = trimmed.match(/^(\d+)\s*(ms|s|m|h|d)$/i);
  if (!match) {
    return null;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "ms") return amount;
  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60 * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  if (unit === "d") return amount * 24 * 60 * 60 * 1000;
  return null;
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  if (!cookieHeader) return {};
  const pairs = cookieHeader.split(";").map((part) => part.trim()).filter(Boolean);
  const cookies = {};
  for (const pair of pairs) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex <= 0) continue;
    const name = pair.slice(0, eqIndex).trim();
    const rawValue = pair.slice(eqIndex + 1).trim();
    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = rawValue;
    }
  }
  return cookies;
}

function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7);
  }
  const cookies = parseCookies(req);
  return cookies[AUTH_COOKIE_NAME] || null;
}

function getCookieOptions(maxAge) {
  const options = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
  };
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }
  if (Number.isFinite(maxAge) && maxAge > 0) {
    options.maxAge = maxAge;
  }
  return options;
}

function setAuthCookie(res, token, remember) {
  const expiresIn = remember ? REMEMBER_EXPIRES_IN : TOKEN_EXPIRES_IN;
  const maxAge = durationToMs(expiresIn);
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions(maxAge));
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, getCookieOptions());
}

function authOptional(req, _res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    req.userId = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
  } catch (err) {
    req.userId = null;
  }
  next();
}

function authRequired(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// Queries (prepared)
const stmtFindUserByUsername = db.prepare(`
  SELECT * FROM users
  WHERE lower(username) = lower(?)
  LIMIT 1
`);
const stmtFindUserById = db.prepare("SELECT * FROM users WHERE id = ?");
const stmtInsertUser = db.prepare(`
  INSERT INTO users (username, password_hash, display_name, calendar_embed, music_urls)
  VALUES (?, ?, ?, ?, ?)
`);
const stmtUpdateUser = db.prepare(`
  UPDATE users SET display_name = ?, calendar_embed = ?, music_urls = ? WHERE id = ?
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
  const normalizedUsername = normalizeUsername(username);
  if (normalizedUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters" });
  }
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  if (stmtFindUserByUsername.get(normalizedUsername)) {
    return res.status(400).json({ error: "Username already exists" });
  }
  const hash = await bcrypt.hash(password, 12);
  const info = stmtInsertUser.run(
    normalizedUsername,
    hash,
    normalizedUsername,
    "",
    serializeMusicUrls(DEFAULT_MUSIC_URLS),
  );
  const user = stmtFindUserById.get(info.lastInsertRowid);
  if (!user) return res.status(500).json({ error: "Failed to create account" });
  const token = signToken(user.id, remember);
  setAuthCookie(res, token, remember);
  res.json({ user: userJson(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { username = "", password = "", remember = false } = req.body || {};
  const normalizedUsername = normalizeUsername(username);
  const user = stmtFindUserByUsername.get(normalizedUsername);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken(user.id, remember);
  setAuthCookie(res, token, remember);
  res.json({ user: userJson(user) });
});

app.post("/api/auth/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

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
  const body = req.body || {};
  const display = (body.display_name || "").trim();
  const calendar = body.calendar_embed || "";
  const hasMusicUrls = Object.prototype.hasOwnProperty.call(body, "music_urls");
  const musicUrls = hasMusicUrls ? parseMusicUrls(body.music_urls) : parseMusicUrls(user.music_urls);
  stmtUpdateUser.run(display, calendar, serializeMusicUrls(musicUrls), req.userId);
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
