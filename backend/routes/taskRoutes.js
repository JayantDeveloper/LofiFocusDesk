const express = require("express");
const {
  createTaskHandler,
  deleteTaskHandler,
  getTasks,
  updateTaskHandler,
} = require("../controllers/taskController");
const { authRequired } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authRequired, getTasks);
router.post("/", authRequired, createTaskHandler);
router.patch("/:id", authRequired, updateTaskHandler);
router.delete("/:id", authRequired, deleteTaskHandler);

module.exports = router;
