const express = require("express");
const { getStartupData } = require("../controllers/startupController");
const { authRequired } = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/", authRequired, asyncHandler(getStartupData));

module.exports = router;
