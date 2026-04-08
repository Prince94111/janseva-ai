const { Report } = require("../../models/report.model");
const { analyzeReport } = require("../ai/analyzeReport");

async function enrichReport(reportId) {
  try {
    const report = await Report.findById(reportId);

    if (!report) {
      throw new Error("Report not found");
    }

    const analysis = await analyzeReport({
      title: report.title,
      description: report.description,
    });

    // 🔥 Update only if values exist
    report.aiCategory = analysis.category || report.aiCategory;
    report.severity = analysis.severity || report.severity;
    report.aiConfidence = analysis.confidence ?? report.aiConfidence;
    report.aiInsights = analysis.insights || report.aiInsights;
    report.suggestedDepartment =
      analysis.suggestedDepartment || report.suggestedDepartment;

    await report.save();

    return report;
  } catch (error) {
    console.error("enrichReport error:", error.message);
    throw error;
  }
}

module.exports = { enrichReport };