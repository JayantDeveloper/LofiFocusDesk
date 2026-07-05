const { getTaskStats, listTasks } = require("../utils/repositories/taskRepository");
const { getPomodoroStateByUserId } = require("../utils/repositories/pomodoroRepository");

async function getStartupData(req, res) {
  const [tasks, taskStats, pomodoroRow] = await Promise.all([
    listTasks(req.userId),
    getTaskStats(req.userId),
    getPomodoroStateByUserId(req.userId),
  ]);

  let pomodoroState = {};
  if (pomodoroRow?.data) {
    try {
      pomodoroState = JSON.parse(pomodoroRow.data);
    } catch {
      pomodoroState = {};
    }
  }

  res.json({ tasks, taskStats, pomodoro: { state: pomodoroState } });
}

module.exports = { getStartupData };
