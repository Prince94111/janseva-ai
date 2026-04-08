const { Report } = require("../../models/report.model");

async function createReport(data) {
  const {
    title,
    description,
    category,
    district,
    location,
    reportedBy,
    files = [],
  } = data;

  // 🔥 Basic validation
  if (!title || !description) {
    throw new Error("Title and description are required");
  }

  const photos = Array.isArray(files)
    ? files
        .map((file) => file && file.path)
        .filter((path) => typeof path === "string" && path.trim())
    : [];

  const report = await Report.create({
    title,
    description,
    category,
    district,
    location,
    reportedBy,
    photos,
    status: "pending",
    votes: 0,
  });

  return report;
}

module.exports = { createReport };