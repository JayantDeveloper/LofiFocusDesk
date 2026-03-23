const express = require("express");
const {
  getUserProfile,
  updateUserProfileHandler,
} = require("../controllers/userController");
const { authRequired } = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/", authRequired, asyncHandler(getUserProfile));
router.put("/", authRequired, asyncHandler(updateUserProfileHandler));

module.exports = router;
