const express = require("express");

const {
  createReport,
  getReports,
  getReportById,
  voteReport,
  updateStatus,
  addComment,
} = require("../../controllers/report.controller");

const { protect }   = require("../../middleware/auth.middleware");
const { roleGuard } = require("../../middleware/role.middleware");
const upload        = require("../../middleware/upload.middleware");

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// PUBLIC — no auth needed
// ─────────────────────────────────────────────────────────────────
router.get("/",    getReports);
router.get("/:id", getReportById);

// ─────────────────────────────────────────────────────────────────
// CITIZEN — auth required
// ─────────────────────────────────────────────────────────────────
router.post("/",          protect, upload, createReport);
router.patch("/:id/vote", protect, voteReport);          // ✅ PATCH not POST
router.post("/:id/comments", protect, addComment);

// ─────────────────────────────────────────────────────────────────
// OFFICER — auth + role required
// ─────────────────────────────────────────────────────────────────
router.patch("/:id/status", protect, roleGuard("officer"), updateStatus);

module.exports = router;