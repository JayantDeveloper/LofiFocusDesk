const express = require("express");
const {
  getCurrentUser,
  login,
  logout,
  register,
} = require("../controllers/authController");
const { authOptional } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authOptional, getCurrentUser);

module.exports = router;
