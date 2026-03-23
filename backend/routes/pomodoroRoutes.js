const express = require("express");
const {
  getPomodoroState,
  updatePomodoroState,
} = require("../controllers/pomodoroController");
const { authRequired } = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/", authRequired, asyncHandler(getPomodoroState));
router.put("/", authRequired, asyncHandler(updatePomodoroState));

module.exports = router;
