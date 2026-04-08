const express = require("express");
const router = express.Router();

const { analyzeReportController } = require("../../controllers/ai.controller");
const { protect } = require("../../middleware/auth.middleware");
router.post("/analyze", protect, analyzeReportController);
module.exports = router;