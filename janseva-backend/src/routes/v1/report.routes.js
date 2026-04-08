const express = require("express");
const router = express.Router();

const reportController = require("../../controllers/report.controller");
const upload = require("../../middleware/upload.middleware");

const { protect } = require("../../middleware/auth.middleware");
const { roleGuard } = require("../../middleware/role.middleware");

// PUBLIC
router.get("/", reportController.getReports);
router.get("/:id", reportController.getReportById);

// PROTECTED
router.post("/", protect, upload, reportController.createReport);
router.patch("/:id/status", protect, roleGuard("officer"), reportController.updateStatus);
router.post("/:id/vote", protect, reportController.voteReport);
router.post("/:id/comments", protect, reportController.addComment);

module.exports = router;