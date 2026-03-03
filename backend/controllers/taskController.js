const { TODO_DIFFICULTY_OPTIONS } = require("../constants/taskConstants");
const {
  createTask,
  deleteTaskForUser,
  findTaskForUser,
  listTasks,
  updateTaskForUser,
} = require("../utils/repositories/taskRepository");

function getTasks(req, res) {
  const tasks = listTasks(req.userId);
  res.json({ tasks });
}

function createTaskHandler(req, res) {
  const title = String(req.body?.title || "").trim();
  const difficulty = TODO_DIFFICULTY_OPTIONS.includes(req.body?.difficulty)
    ? req.body.difficulty
    : TODO_DIFFICULTY_OPTIONS[0];
  const done = req.body?.done === true ? 1 : 0;

  const task = createTask(req.userId, { title, difficulty, done });
  res.status(201).json({ task });
}

function updateTaskHandler(req, res) {
  const task = findTaskForUser(req.params.id, req.userId);

  if (!task) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const body = req.body || {};

  const title = Object.prototype.hasOwnProperty.call(body, "title")
    ? String(body.title || "").trim()
    : task.title;

  const difficulty = Object.prototype.hasOwnProperty.call(body, "difficulty")
    && TODO_DIFFICULTY_OPTIONS.includes(body.difficulty)
    ? body.difficulty
    : task.difficulty;

  const done = Object.prototype.hasOwnProperty.call(body, "done")
    ? (body.done ? 1 : 0)
    : task.done;

  const position = Object.prototype.hasOwnProperty.call(body, "position")
    && Number.isInteger(body.position)
    ? body.position
    : task.position;

  const updatedTask = updateTaskForUser(task.id, req.userId, {
    title,
    difficulty,
    done,
    position,
  });

  res.json({ task: updatedTask });
}

function deleteTaskHandler(req, res) {
  const task = findTaskForUser(req.params.id, req.userId);

  if (!task) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  deleteTaskForUser(task.id, req.userId);
  res.json({ ok: true });
}

module.exports = {
  createTaskHandler,
  deleteTaskHandler,
  getTasks,
  updateTaskHandler,
};
