const { Report } = require("../models/report.model");
const { getPriorityScore } = require("../services/trending/aggregation");

// ─────────────────────────────────────────────────────────────────
// 🔴 Priority Queue  (score computed in DB order, paginated correctly)
// ─────────────────────────────────────────────────────────────────
async function getPriorityQueue(req, res) {
  try {
    const page  = Math.max(Number.parseInt(req.query.page,  10) || 1,  1);
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 50);
    const skip  = (page - 1) * limit;

    const filter = {
      severity: { $in: ["critical", "high"] },
      status:   "pending",
    };

    // ✅ FIXED: fetch ALL matching docs, score in JS, THEN paginate
    // This ensures priorityScore sort is global, not per-page
    const allReports = await Report.find(filter)
      .populate("reportedBy", "name")
      .lean();

    const scored = allReports
      .map((r) => ({ ...r, priorityScore: getPriorityScore(r) }))
      .sort((a, b) => b.priorityScore - a.priorityScore);

    const total   = scored.length;
    const reports = scored.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      data: {
        reports,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// 🟡 Department Queue  (priority-sorted, filterable by dept)
// ─────────────────────────────────────────────────────────────────
async function getDepartmentQueue(req, res) {
  try {
    const page  = Math.max(Number.parseInt(req.query.page,  10) || 1,  1);
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 50);
    const skip  = (page - 1) * limit;

    const filter = {
      status: { $nin: ["resolved", "closed"] },
    };

    if (req.query.dept) {
      filter.suggestedDepartment = req.query.dept;
    }

    // ✅ FIXED: also priority-sorted so officers see urgent first
    const allReports = await Report.find(filter)
      .populate("reportedBy", "name")
      .lean();

    const scored = allReports
      .map((r) => ({ ...r, priorityScore: getPriorityScore(r) }))
      .sort((a, b) => b.priorityScore - a.priorityScore);

    const total   = scored.length;
    const reports = scored.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      data: {
        reports,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// 🟢 Official Response  (officer-only, no status regression)
// ─────────────────────────────────────────────────────────────────
async function postOfficialResponse(req, res) {
  try {
    // ✅ FIXED: role guard — citizens cannot post official responses
    if (!req.user || req.user.role !== "officer") {
      return res.status(403).json({
        success: false,
        message: "Only government officers can post official responses",
      });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Response message is required",
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // ✅ FIXED: no status regression — don't overwrite resolved/closed
    const TERMINAL_STATUSES = ["resolved", "closed"];
    if (!TERMINAL_STATUSES.includes(report.status)) {
      report.status = "in_progress";
    }

    report.governmentResponse = {
      message:     message.trim(),
      officerName: req.user.name,
      officerId:   req.user._id,
      updatedAt:   new Date(),
    };

    const updatedReport = await report.save();

    return res.status(200).json({
      success: true,
      data: updatedReport,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// 📊 Dashboard Stats  (single $facet round-trip)
// ─────────────────────────────────────────────────────────────────
async function getDashboardStats(req, res) {
  try {
    // ✅ FIXED: one aggregation instead of 5 separate countDocuments calls
    const [result] = await Report.aggregate([
      {
        $facet: {
          total:      [{ $count: "count" }],
          pending:    [{ $match: { status: "pending" } },    { $count: "count" }],
          inProgress: [{ $match: { status: "in_progress" } },{ $count: "count" }],
          resolved:   [{ $match: { status: "resolved" } },   { $count: "count" }],
          critical:   [{ $match: { severity: "critical" } },  { $count: "count" }],
          closed:     [{ $match: { status: "closed" } },      { $count: "count" }],
        },
      },
      {
        $project: {
          total:      { $ifNull: [{ $arrayElemAt: ["$total.count",      0] }, 0] },
          pending:    { $ifNull: [{ $arrayElemAt: ["$pending.count",    0] }, 0] },
          inProgress: { $ifNull: [{ $arrayElemAt: ["$inProgress.count", 0] }, 0] },
          resolved:   { $ifNull: [{ $arrayElemAt: ["$resolved.count",   0] }, 0] },
          critical:   { $ifNull: [{ $arrayElemAt: ["$critical.count",   0] }, 0] },
          closed:     { $ifNull: [{ $arrayElemAt: ["$closed.count",     0] }, 0] },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getPriorityQueue,
  getDepartmentQueue,
  postOfficialResponse,
  getDashboardStats,
};