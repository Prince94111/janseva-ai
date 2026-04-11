const { Report } = require("../../models/report.model");

const fetch = require("node-fetch");

// ── AI image detection ──────────────────────────────────────────
async function checkAIImage(imageUrl) {
  try {
    const params = new URLSearchParams({
      url: imageUrl,
      models: "genai",
      api_user: process.env.SIGHTENGINE_API_USER,
      api_secret: process.env.SIGHTENGINE_API_SECRET,
    });

    const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`);
    const data = await res.json();
    return data.type?.ai_generated ?? 0; // score 0–1
  } catch (err) {
    console.error("AI check failed:", err.message);
    return 0; // if check fails, don't block the report
  }
}

// ── Create Report ───────────────────────────────────────────────
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

  if (!title || !description) {
    throw new Error("Title and description are required");
  }

  const photos = Array.isArray(files)
    ? files
        .map((file) => file && file.path)
        .filter((path) => typeof path === "string" && path.trim())
    : [];

  // ── AI Detection: check first uploaded photo ─────────────────
  if (photos.length > 0) {
    const aiScore = await checkAIImage(photos[0]);
    if (aiScore > 0.85) {
      const error = new Error("Image appears to be AI-generated. Please upload a real photo of the issue.");
      error.statusCode = 400;
      throw error;
    }
  }
  // ─────────────────────────────────────────────────────────────

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