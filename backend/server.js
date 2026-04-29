const express = require("express");
const cors = require("cors");
const {
  allowedFrontendOrigins,
  normalizeOrigin,
  PORT,
} = require("./constants/serverConfig");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const healthRoutes = require("./routes/healthRoutes");
const pomodoroRoutes = require("./routes/pomodoroRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const startupRoutes = require("./routes/startupRoutes");

const app = express();

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

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/pomodoro", pomodoroRoutes);
app.use("/api/startup", startupRoutes);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`FocusDesk backend running on http://localhost:${PORT}`);
});

// Keep Render free-tier from spinning down: self-ping every 14 minutes.
// Only runs in production where the service URL is known.
const SELF_URL = process.env.RENDER_EXTERNAL_URL;
if (SELF_URL) {
  // 4 min keeps Neon free-tier compute awake (sleeps after 5 min idle).
  const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000;
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/api/health`);
    } catch {
      // Non-fatal — network blip during self-ping.
    }
  }, KEEP_ALIVE_INTERVAL_MS);
  console.log(`[keep-alive] Self-pinging ${SELF_URL}/api/health every 4 min`);
}

module.exports = app;
