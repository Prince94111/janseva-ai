const mongoose = require("mongoose");

const { Report, REPORT_STATUS } = require("../models/report.model");
const { Comment } = require("../models/comment.model");
const { USER_ROLES } = require("../models/user.model");
const {
  createReport: createReportService,
} = require("../services/report/createReport");
const {
  enrichReport,
} = require("../services/report/enrichReport");

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

    enrichReport(report._id).catch((error) => {
      console.error("Report enrichment failed:", error.message);
    });

    return res.status(201).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("Controller Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function getReports(req, res) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(Number.parseInt(req.query.limit, 10) || 20, 1);

    const filters = {};
    const filterKeys = ["district", "category", "severity", "status"];

    for (const key of filterKeys) {
      if (req.query[key]) {
        filters[key] = req.query[key];
      }
    }

    const [reports, total] = await Promise.all([
      Report.find(filters)
        .sort({ votes: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("reportedBy", "name")
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
    console.error("Controller Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function getReportById(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const report = await Report.findById(req.params.id).populate(
      "reportedBy",
      "name"
    ).lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("Controller Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function updateStatus(req, res) {
  try {
    if (req.user?.role !== USER_ROLES.OFFICER) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const { status, message, officerName } = req.body || {};
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
        message: "Invalid status value",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    report.status = status;
    report.governmentResponse = {
      message,
      officerName,
      updatedAt: new Date(),
    };

    const updatedReport = await report.save();

    return res.status(200).json({
      success: true,
      data: updatedReport,
    });
  } catch (err) {
    console.error("Controller Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function voteReport(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const userId = req.user?._id || req.user?.id;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const voterIds = report.voterIds || [];
    const hasAlreadyVoted = voterIds.some(
      (voterId) => voterId.toString() === String(userId)
    );

    if (hasAlreadyVoted) {
      return res.status(400).json({
        success: false,
        message: "You have already voted for this report",
      });
    }

    report.voterIds.push(userId);
    report.votes += 1;

    const updatedReport = await report.save();

    return res.status(200).json({
      success: true,
      data: updatedReport,
    });
  } catch (err) {
    console.error("Controller Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function addComment(req, res) {
  try {
    if (!req.body?.text) {
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
      report: req.params.id,
      user: req.user?._id || req.user?.id,
      text: req.body?.text,
      isOfficialResponse: req.user?.role === USER_ROLES.OFFICER,
    });

    return res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (err) {
    console.error("Controller Error:", err);

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
  updateStatus,
  voteReport,
  addComment,
};
