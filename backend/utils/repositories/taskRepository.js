const pool = require("../db");

function toTaskJson(task) {
  if (!task) return null;
  return {
    id: task.id,
    title: task.title,
    difficulty: task.difficulty,
    status: task.status ?? "Not Started",
    dueDate: task.due_date ?? "",
    notes: task.notes ?? "",
    done: task.done === true || task.done === 1,
    position: task.position,
  };
}

async function listTasks(userId) {
  const { rows } = await pool.query(
    "SELECT id, title, difficulty, status, due_date, notes, done, position FROM tasks WHERE user_id = $1 ORDER BY position, id",
    [userId],
  );
  return rows.map(toTaskJson);
}

async function createTask(userId, { title, difficulty, status, dueDate, notes, done }) {
  const { rows: maxRows } = await pool.query(
    "SELECT COALESCE(MAX(position), 0) as maxpos FROM tasks WHERE user_id = $1",
    [userId],
  );
  const maxPosition = Number(maxRows[0]?.maxpos) || 0;
  const { rows } = await pool.query(
    `INSERT INTO tasks (user_id, title, difficulty, status, due_date, notes, done, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, title, difficulty, status ?? "Not Started", dueDate ?? "", notes ?? "", done ? 1 : 0, maxPosition + 1],
  );
  return toTaskJson(rows[0]);
}

async function findTaskForUser(taskId, userId) {
  const { rows } = await pool.query(
    "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
    [taskId, userId],
  );
  return rows[0] ?? null;
}

async function updateTaskForUser(taskId, userId, { title, difficulty, status, dueDate, notes, done, position }) {
  await pool.query(
    `UPDATE tasks
     SET title = $1, difficulty = $2, status = $3, due_date = $4, notes = $5,
         done = $6, position = $7, updated_at = CURRENT_TIMESTAMP
     WHERE id = $8 AND user_id = $9`,
    [title, difficulty, status ?? "Not Started", dueDate ?? "", notes ?? "", done ? 1 : 0, position, taskId, userId],
  );
  const { rows } = await pool.query(
    "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
    [taskId, userId],
  );
  return toTaskJson(rows[0]);
}

async function deleteTaskForUser(taskId, userId) {
  await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [taskId, userId]);
}

function toTaskStatsJson(row) {
  return {
    doneTasks: Number(row?.done_tasks) || 0,
    createdTasks: Number(row?.created_tasks) || 0,
    earnedTokens: Number(row?.earned_tokens) || 0,
  };
}

async function getTaskStats(userId) {
  const { rows } = await pool.query(
    "SELECT done_tasks, created_tasks, earned_tokens FROM task_stats WHERE user_id = $1",
    [userId],
  );
  return toTaskStatsJson(rows[0]);
}

async function bumpTaskStats(userId, { done = 0, created = 0, tokens = 0 }) {
  const { rows } = await pool.query(
    `INSERT INTO task_stats (user_id, done_tasks, created_tasks, earned_tokens)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       done_tasks = task_stats.done_tasks + EXCLUDED.done_tasks,
       created_tasks = task_stats.created_tasks + EXCLUDED.created_tasks,
       earned_tokens = task_stats.earned_tokens + EXCLUDED.earned_tokens,
       updated_at = CURRENT_TIMESTAMP
     RETURNING done_tasks, created_tasks, earned_tokens`,
    [userId, done, created, tokens],
  );
  return toTaskStatsJson(rows[0]);
}

async function resetTaskStats(userId, createdTasks) {
  const { rows } = await pool.query(
    `INSERT INTO task_stats (user_id, done_tasks, created_tasks, earned_tokens)
     VALUES ($1, 0, $2, 0)
     ON CONFLICT (user_id) DO UPDATE SET
       done_tasks = 0,
       created_tasks = EXCLUDED.created_tasks,
       earned_tokens = 0,
       updated_at = CURRENT_TIMESTAMP
     RETURNING done_tasks, created_tasks, earned_tokens`,
    [userId, Math.max(0, Number(createdTasks) || 0)],
  );
  return toTaskStatsJson(rows[0]);
}

// Safety net: Done tasks are normally deleted the moment they are completed,
// but any that slip through (older clients, direct API writes) get pruned.
async function pruneStaleDoneTasks(maxAgeDays = 7) {
  const { rowCount } = await pool.query(
    "DELETE FROM tasks WHERE status = 'Done' AND updated_at < NOW() - ($1 * INTERVAL '1 day')",
    [maxAgeDays],
  );
  return rowCount;
}

module.exports = {
  bumpTaskStats,
  createTask,
  deleteTaskForUser,
  findTaskForUser,
  getTaskStats,
  listTasks,
  pruneStaleDoneTasks,
  resetTaskStats,
  updateTaskForUser,
};
