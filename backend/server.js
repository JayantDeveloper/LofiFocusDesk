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

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FocusDesk backend running on http://localhost:${PORT}`);
});

module.exports = app;
