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

module.exports = {
  createTask,
  deleteTaskForUser,
  findTaskForUser,
  listTasks,
  updateTaskForUser,
};
