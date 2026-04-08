const { Report } = require("../../models/report.model");

async function getHeatmapMarkers() {
  const reports = await Report.find(
    {
      status: { $nin: ["resolved", "closed"] },
      "location.coordinates": { $exists: true, $size: 2 }, // ✅ fixed weak check
    },
    {
      _id: 0,
      reportId: 1,
      title: 1,
      district: 1,
      severity: 1,
      category: 1,
      votes: 1,
      "location.coordinates": 1,
    }
  ).lean();

  return reports
    .filter(
      (r) =>
        Array.isArray(r.location?.coordinates) &&
        r.location.coordinates.length === 2 &&
        typeof r.location.coordinates[0] === "number" &&
        typeof r.location.coordinates[1] === "number"
    )
    .map((r) => ({
      lat:      r.location.coordinates[1],
      lng:      r.location.coordinates[0],
      severity: r.severity,
      category: r.category,
      reportId: r.reportId,
      title:    r.title,
      district: r.district,
      votes:    r.votes || 0,
    }));
}

module.exports = { getHeatmapMarkers };