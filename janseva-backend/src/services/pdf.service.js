const PDFDocument = require("pdfkit");

function generateReportPDF(report) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end",  () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // ── Header ────────────────────────────────────────────────
      doc
        .fillColor("#1a1a2e")
        .rect(0, 0, 612, 80)
        .fill();

      doc
        .fillColor("#ffffff")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("JanSeva AI", 50, 20);

      doc
        .fillColor("#f59e0b")
        .fontSize(10)
        .font("Helvetica")
        .text("Uttarakhand Civic Issue Report", 50, 48);

      doc
        .fillColor("#ffffff")
        .fontSize(9)
        .text(`Generated: ${new Date().toLocaleString("en-IN")}`, 400, 35, { align: "right" });

      // ── Report ID Banner ──────────────────────────────────────
      doc
        .fillColor("#f59e0b")
        .rect(0, 80, 612, 32)
        .fill();

      doc
        .fillColor("#1a1a2e")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(`Report ID: ${report.reportId || report._id}`, 50, 91);

      doc
        .fillColor("#1a1a2e")
        .fontSize(10)
        .font("Helvetica")
        .text(`Status: ${(report.status || "pending").toUpperCase()}`, 400, 91, { align: "right" });

      // ── Title ─────────────────────────────────────────────────
      doc.moveDown(3);
      doc
        .fillColor("#1a1a2e")
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(report.title || "Untitled Report", 50, 130);

      // ── Divider ───────────────────────────────────────────────
      doc
        .moveTo(50, 158)
        .lineTo(562, 158)
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .stroke();

      // ── Info Grid ─────────────────────────────────────────────
      const infoY = 170;

      // Left column
      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("CATEGORY", 50, infoY)
        .fillColor("#1a1a2e")
        .fontSize(11)
        .font("Helvetica")
        .text((report.category || "other").replace(/_/g, " ").toUpperCase(), 50, infoY + 14);

      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("DISTRICT", 50, infoY + 40)
        .fillColor("#1a1a2e")
        .fontSize(11)
        .font("Helvetica")
        .text(report.district || "Unknown", 50, infoY + 54);

      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("REPORTED BY", 50, infoY + 80)
        .fillColor("#1a1a2e")
        .fontSize(11)
        .font("Helvetica")
        .text(report.reportedBy?.name || "Anonymous Citizen", 50, infoY + 94);

      // Right column
      const severityColor = {
        critical: "#dc2626",
        high:     "#ea580c",
        medium:   "#ca8a04",
        low:      "#16a34a",
      }[report.severity] || "#6b7280";

      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("SEVERITY", 320, infoY)
        .fillColor(severityColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text((report.severity || "low").toUpperCase(), 320, infoY + 14);

      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("DATE FILED", 320, infoY + 40)
        .fillColor("#1a1a2e")
        .fontSize(11)
        .font("Helvetica")
        .text(
          report.createdAt
            ? new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
            : "Unknown",
          320, infoY + 54
        );

      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("SUGGESTED DEPARTMENT", 320, infoY + 80)
        .fillColor("#1a1a2e")
        .fontSize(11)
        .font("Helvetica")
        .text(report.suggestedDepartment || "General Administration", 320, infoY + 94);

      // ── Priority Score Box ────────────────────────────────────
      doc
        .fillColor("#fef3c7")
        .rect(50, infoY + 125, 512, 36)
        .fill();

      doc
        .fillColor("#92400e")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`⚡ Priority Score: ${report.priorityScore || "N/A"}  ·  Community Votes: ${report.votes || 0}  ·  AI Confidence: ${report.aiConfidence ? Math.round(report.aiConfidence * 100) + "%" : "N/A"}`, 60, infoY + 143);

      // ── Divider ───────────────────────────────────────────────
      doc
        .moveTo(50, infoY + 175)
        .lineTo(562, infoY + 175)
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .stroke();

      // ── Description ───────────────────────────────────────────
      doc
        .fillColor("#6b7280")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("DESCRIPTION", 50, infoY + 185);

      doc
        .fillColor("#1a1a2e")
        .fontSize(11)
        .font("Helvetica")
        .text(report.description || "No description provided.", 50, infoY + 200, {
          width: 512,
          lineGap: 4,
        });

      // ── AI Insights ───────────────────────────────────────────
      if (report.aiInsights) {
        const aiY = doc.y + 20;

        doc
          .fillColor("#eff6ff")
          .rect(50, aiY, 512, 14 + 30)
          .fill();

        doc
          .fillColor("#1d4ed8")
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("🤖 AI INSIGHTS", 60, aiY + 6);

        doc
          .fillColor("#1e40af")
          .fontSize(10)
          .font("Helvetica")
          .text(report.aiInsights, 60, aiY + 20, { width: 500, lineGap: 3 });
      }

      // ── Government Response ───────────────────────────────────
      if (report.governmentResponse?.message) {
        const govY = doc.y + 20;

        doc
          .fillColor("#f0fdf4")
          .rect(50, govY, 512, 14 + 30)
          .fill();

        doc
          .fillColor("#15803d")
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("✓ GOVERNMENT RESPONSE", 60, govY + 6);

        doc
          .fillColor("#166534")
          .fontSize(10)
          .font("Helvetica")
          .text(report.governmentResponse.message, 60, govY + 20, { width: 500, lineGap: 3 });

        if (report.governmentResponse.officerName) {
          doc
            .fillColor("#6b7280")
            .fontSize(9)
            .text(`— ${report.governmentResponse.officerName}`, 60, doc.y + 4);
        }
      }

      // ── Footer ────────────────────────────────────────────────
      doc
        .fillColor("#f3f4f6")
        .rect(0, 762, 612, 80)
        .fill();

      doc
        .fillColor("#6b7280")
        .fontSize(8)
        .font("Helvetica")
        .text("This report was automatically generated by JanSeva AI.", 50, 772)
        .text("For official use — Uttarakhand Civic Issue Management System", 50, 785)
        .text(`Report ID: ${report.reportId || report._id}  ·  ${new Date().toISOString()}`, 50, 798);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReportPDF };