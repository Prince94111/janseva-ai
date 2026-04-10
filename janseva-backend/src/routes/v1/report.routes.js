const express = require("express");
const router = express.Router(); // ✅ Keep this one only

const {
  createReport,
  getReports,
  getReportById,
  voteReport,
  updateStatus,
  addComment,
} = require("../../controllers/report.controller");

const { downloadReportPDF } = require("../../controllers/pdf.controller");

const { protect }   = require("../../middleware/auth.middleware");
const { roleGuard } = require("../../middleware/role.middleware");
const upload        = require("../../middleware/upload.middleware");

// PUBLIC
router.get("/",        getReports);
router.get("/:id/pdf", downloadReportPDF);
router.get("/:id",     getReportById);

// CITIZEN
router.post("/",             protect, upload, createReport);
router.patch("/:id/vote",    protect, voteReport);
router.post("/:id/comments", protect, addComment);

// OFFICER
router.patch("/:id/status", protect, roleGuard("officer"), updateStatus);

module.exports = router;