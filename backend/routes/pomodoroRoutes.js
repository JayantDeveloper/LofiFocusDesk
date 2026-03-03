const express = require("express");
const {
  getPomodoroState,
  updatePomodoroState,
} = require("../controllers/pomodoroController");
const { authRequired } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authRequired, getPomodoroState);
router.put("/", authRequired, updatePomodoroState);

module.exports = router;
