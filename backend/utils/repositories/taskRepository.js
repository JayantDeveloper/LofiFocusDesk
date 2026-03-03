const db = require("../db");

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

function toTaskJson(task) {
  if (!task) return null;

  return {
    id: task.id,
    title: task.title,
    difficulty: task.difficulty,
    done: !!task.done,
    position: task.position,
  };
}

function listTasks(userId) {
  return stmtListTasks.all(userId).map((task) => toTaskJson(task));
}

function createTask(userId, { title, difficulty, done }) {
  const maxPosition = stmtMaxPosition.get(userId).maxPos || 0;
  const info = stmtInsertTask.run(userId, title, difficulty, done, maxPosition + 1);
  const task = stmtFindTask.get(info.lastInsertRowid, userId);
  return toTaskJson(task);
}

function findTaskForUser(taskId, userId) {
  return stmtFindTask.get(taskId, userId);
}

function updateTaskForUser(taskId, userId, {
  title,
  difficulty,
  done,
  position,
}) {
  stmtUpdateTask.run(title, difficulty, done, position, taskId, userId);
  return toTaskJson(stmtFindTask.get(taskId, userId));
}

function deleteTaskForUser(taskId, userId) {
  stmtDeleteTask.run(taskId, userId);
}

module.exports = {
  createTask,
  deleteTaskForUser,
  findTaskForUser,
  listTasks,
  updateTaskForUser,
};
