const {
  getPomodoroStateByUserId,
  upsertPomodoroState,
} = require("../utils/repositories/pomodoroRepository");

function parsePomodoroData(row) {
  if (!row?.data) return {};

  try {
    const parsed = JSON.parse(row.data);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function getPomodoroState(req, res) {
  const row = await getPomodoroStateByUserId(req.userId);
  res.json({ state: parsePomodoroData(row) });
}

async function updatePomodoroState(req, res) {
  const payload = req.body || {};
  await upsertPomodoroState(req.userId, JSON.stringify(payload));
  res.json({ state: payload });
}

module.exports = {
  getPomodoroState,
  updatePomodoroState,
};
