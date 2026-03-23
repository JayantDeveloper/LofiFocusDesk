const { TODO_DIFFICULTY_OPTIONS, TODO_STATUS_OPTIONS } = require("../constants/taskConstants");
const {
  createTask,
  deleteTaskForUser,
  findTaskForUser,
  listTasks,
  updateTaskForUser,
} = require("../utils/repositories/taskRepository");

async function getTasks(req, res) {
  const tasks = await listTasks(req.userId);
  res.json({ tasks });
}

async function createTaskHandler(req, res) {
  const body = req.body || {};
  const title = String(body.title || "").trim();
  const difficulty = TODO_DIFFICULTY_OPTIONS.includes(body.difficulty)
    ? body.difficulty
    : TODO_DIFFICULTY_OPTIONS[0];
  const status = TODO_STATUS_OPTIONS.includes(body.status) ? body.status : "Not Started";
  const dueDate = typeof body.dueDate === "string" ? body.dueDate : "";
  const notes = typeof body.notes === "string" ? body.notes : "";
  const done = body.done === true ? 1 : 0;

  const task = await createTask(req.userId, { title, difficulty, status, dueDate, notes, done });
  res.status(201).json({ task });
}

async function updateTaskHandler(req, res) {
  const task = await findTaskForUser(req.params.id, req.userId);

  if (!task) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const body = req.body || {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  const title = has("title") ? String(body.title || "").trim() : task.title;

  const difficulty = has("difficulty") && TODO_DIFFICULTY_OPTIONS.includes(body.difficulty)
    ? body.difficulty
    : task.difficulty;

  const status = has("status") && TODO_STATUS_OPTIONS.includes(body.status)
    ? body.status
    : (task.status ?? "Not Started");

  const dueDate = has("dueDate") ? String(body.dueDate ?? "") : (task.due_date ?? "");
  const notes = has("notes") ? String(body.notes ?? "") : (task.notes ?? "");

  const done = has("done") ? (body.done ? 1 : 0) : task.done;

  const position = has("position") && Number.isInteger(body.position)
    ? body.position
    : task.position;

  const updatedTask = await updateTaskForUser(task.id, req.userId, {
    title, difficulty, status, dueDate, notes, done, position,
  });

  res.json({ task: updatedTask });
}

async function deleteTaskHandler(req, res) {
  const task = await findTaskForUser(req.params.id, req.userId);

  if (!task) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await deleteTaskForUser(task.id, req.userId);
  res.json({ ok: true });
}

module.exports = {
  createTaskHandler,
  deleteTaskHandler,
  getTasks,
  updateTaskHandler,
};
