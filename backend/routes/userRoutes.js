const express = require("express");
const {
  getUserProfile,
  updateUserProfileHandler,
} = require("../controllers/userController");
const { authRequired } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authRequired, getUserProfile);
router.put("/", authRequired, updateUserProfileHandler);

module.exports = router;
