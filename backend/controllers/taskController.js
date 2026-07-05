const { DIFFICULTY_XP, TODO_DIFFICULTY_OPTIONS, TODO_STATUS_OPTIONS } = require("../constants/taskConstants");
const {
  bumpTaskStats,
  createTask,
  deleteTaskForUser,
  findTaskForUser,
  getTaskStats,
  listTasks,
  resetTaskStats,
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
  await bumpTaskStats(req.userId, { created: 1 });
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

  // Completing a task removes it and rolls it into the persistent task score,
  // so Done rows never accumulate in the table.
  if (status === "Done" && task.status !== "Done") {
    await deleteTaskForUser(task.id, req.userId);
    const stats = await bumpTaskStats(req.userId, {
      done: 1,
      tokens: DIFFICULTY_XP[task.difficulty] ?? DIFFICULTY_XP.Easy,
    });
    res.json({ task: null, completed: true, stats });
    return;
  }

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

async function getTaskStatsHandler(req, res) {
  const stats = await getTaskStats(req.userId);
  res.json({ stats });
}

async function resetTaskStatsHandler(req, res) {
  const tasks = await listTasks(req.userId);
  const openTaskCount = tasks.filter((task) => task.status !== "Done").length;
  const stats = await resetTaskStats(req.userId, openTaskCount);
  res.json({ stats });
}

module.exports = {
  createTaskHandler,
  deleteTaskHandler,
  getTasks,
  getTaskStatsHandler,
  resetTaskStatsHandler,
  updateTaskHandler,
};
