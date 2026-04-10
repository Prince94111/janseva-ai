const mongoose = require("mongoose");
const { Report } = require("../models/report.model");
const { getPriorityScore } = require("../services/trending/aggregation");
const { generateReportPDF } = require("../services/pdf.service");

async function downloadReportPDF(req, res) {
  try {
    const { id } = req.params;

    // Accept both _id and reportId
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { reportId: id };

    const report = await Report.findOne(query)
      .populate("reportedBy", "name")
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Add priority score
    report.priorityScore = getPriorityScore(report);

    const pdfBuffer = await generateReportPDF(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="JanSeva-${report.reportId || report._id}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
    });
  }
}

module.exports = { downloadReportPDF };