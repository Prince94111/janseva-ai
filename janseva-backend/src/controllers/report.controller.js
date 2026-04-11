const mongoose = require("mongoose");

const { Report, REPORT_STATUS } = require("../models/report.model");
const { Comment } = require("../models/comment.model");
const { getPriorityScore } = require("../services/trending/aggregation");
const { createReport: createReportService } = require("../services/report/createReport");
const { enrichReport } = require("../services/report/enrichReport");

// ─────────────────────────────────────────────────────────────────
// POST /reports — Create a new report
// ─────────────────────────────────────────────────────────────────
async function createReport(req, res) {
  try {
    const { title, description } = req.body || {};

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const reportData = {
      ...req.body,
      files: req.files,
      reportedBy: req.user?._id || req.user?.id,
    };

    const report = await createReportService(reportData);

    // AI enrichment runs in background — never blocks response
    enrichReport(report._id).catch((err) => {
      console.error("Enrichment failed:", err.message);
    });

    return res.status(201).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("createReport Error:", err);

    if (err.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /reports — List reports with filters + pagination
// ─────────────────────────────────────────────────────────────────
async function getReports(req, res) {
  try {
    const page  = Math.max(Number.parseInt(req.query.page,  10) || 1,  1);
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 50); // ✅ FIXED: max 50

    const filters = {};
    for (const key of ["district", "category", "severity", "status"]) {
      if (req.query[key]) filters[key] = req.query[key];
    }

    const [reports, total] = await Promise.all([
      Report.find(filters)
        .sort({ votes: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("reportedBy", "name")
        .select("-voterIds")           // ✅ never expose voterIds
        .lean(),
      Report.countDocuments(filters),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        reports,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("getReports Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /reports/:id — Get single report by _id OR reportId
// ─────────────────────────────────────────────────────────────────
async function getReportById(req, res) {
  try {
    const { id } = req.params;

    // ✅ FIXED: accept both MongoDB _id and reportId (JS-2026-XXXX)
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { reportId: id };

    const report = await Report.findOne(query)
      .populate("reportedBy", "name")
      .select("-voterIds")             // ✅ never expose voterIds
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // ✅ FIXED: add priorityScore
    report.priorityScore = getPriorityScore(report);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("getReportById Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /reports/:id/vote — Toggle vote (vote / unvote)
// ─────────────────────────────────────────────────────────────────
async function voteReport(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const userId = (req.user?._id || req.user?.id).toString();
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const alreadyVoted = report.voterIds.some(
      (v) => v.toString() === userId
    );

    // ✅ FIXED: toggle — unvote if already voted
    if (alreadyVoted) {
      report.voterIds = report.voterIds.filter(
        (v) => v.toString() !== userId
      );
      report.votes = Math.max(0, report.votes - 1);
    } else {
      report.voterIds.push(userId);
      report.votes += 1;
    }

    await report.save();

    return res.status(200).json({
      success: true,
      data: {
        votes: report.votes,
        voted: !alreadyVoted,          // ✅ tells frontend current state
      },
    });
  } catch (err) {
    console.error("voteReport Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /reports/:id/status — Update status (officer only)
// ─────────────────────────────────────────────────────────────────
async function updateStatus(req, res) {
  try {
    const { status, message } = req.body || {};
    const allowedStatuses = Object.values(REPORT_STATUS);

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required when updating status",
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    report.status = status;
    report.governmentResponse = {
      message,
      officerName: req.user.name,
      officerId:   req.user._id,       // ✅ audit trail
      updatedAt:   new Date(),
    };

    const updated = await report.save();

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("updateStatus Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /reports/:id/comments — Add comment
// ─────────────────────────────────────────────────────────────────
async function addComment(req, res) {
  try {
    if (!req.body?.text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const comment = await Comment.create({
      report:             req.params.id,
      user:               req.user?._id || req.user?.id,
      text:               req.body.text.trim(),
      isOfficialResponse: req.user?.role === "officer",
    });

    return res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (err) {
    console.error("addComment Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
// DELETE /reports/:id
async function deleteReport(req, res) {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { reportId: id };

    const report = await Report.findOne(query);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // ✅ Only owner or officer can delete
    const userId   = req.user._id.toString();
    const isOwner  = report.reportedBy?.toString() === userId;
    const isOfficer = req.user.role === 'officer';

    if (!isOwner && !isOfficer) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this report",
      });
    }

    await Report.findOneAndDelete(query);

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (err) {
    console.error("deleteReport Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
module.exports = {
  createReport,
  getReports,
  getReportById,
  voteReport,
  updateStatus,
  addComment,
  deleteReport,
};