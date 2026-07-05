const express = require("express");
const {
  createTaskHandler,
  deleteTaskHandler,
  getTasks,
  getTaskStatsHandler,
  resetTaskStatsHandler,
  updateTaskHandler,
} = require("../controllers/taskController");
const { authRequired } = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/", authRequired, asyncHandler(getTasks));
router.post("/", authRequired, asyncHandler(createTaskHandler));
router.get("/stats", authRequired, asyncHandler(getTaskStatsHandler));
router.post("/stats/reset", authRequired, asyncHandler(resetTaskStatsHandler));
router.patch("/:id", authRequired, asyncHandler(updateTaskHandler));
router.delete("/:id", authRequired, asyncHandler(deleteTaskHandler));

module.exports = router;
