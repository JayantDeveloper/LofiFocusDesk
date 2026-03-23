const express = require("express");
const {
  getCurrentUser,
  login,
  logout,
  register,
} = require("../controllers/authController");
const { authOptional } = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", logout);
router.get("/me", authOptional, asyncHandler(getCurrentUser));

module.exports = router;
