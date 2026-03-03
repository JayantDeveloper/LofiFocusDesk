const db = require("../db");

const stmtGetPomodoro = db.prepare("SELECT * FROM pomodoro_state WHERE user_id = ?");
const stmtInsertPomodoro = db.prepare("INSERT INTO pomodoro_state (user_id, data) VALUES (?, ?)");
const stmtUpdatePomodoro = db.prepare(
  "UPDATE pomodoro_state SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
);

function getPomodoroStateByUserId(userId) {
  return stmtGetPomodoro.get(userId);
}

function upsertPomodoroState(userId, stateData) {
  const existing = stmtGetPomodoro.get(userId);
  if (existing) {
    stmtUpdatePomodoro.run(stateData, userId);
    return;
  }

  stmtInsertPomodoro.run(userId, stateData);
}

module.exports = {
  getPomodoroStateByUserId,
  upsertPomodoroState,
};
