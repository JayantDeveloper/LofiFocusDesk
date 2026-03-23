const pool = require("../db");

async function getPomodoroStateByUserId(userId) {
  const { rows } = await pool.query(
    "SELECT * FROM pomodoro_state WHERE user_id = $1",
    [userId],
  );
  return rows[0] ?? null;
}

async function upsertPomodoroState(userId, stateData) {
  await pool.query(
    `INSERT INTO pomodoro_state (user_id, data)
     VALUES ($1, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
    [userId, stateData],
  );
}

module.exports = {
  getPomodoroStateByUserId,
  upsertPomodoroState,
};
