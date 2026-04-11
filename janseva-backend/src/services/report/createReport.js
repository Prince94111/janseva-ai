const https = require("https");
const { Report } = require("../../models/report.model");

// ── AI image detection ──────────────────────────────────────────
async function checkAIImage(imageUrl) {
  return new Promise((resolve) => {
    try {
      console.log("🔍 Checking image:", imageUrl); // ← see what URL is being sent

      const params = new URLSearchParams({
        url: imageUrl,
        models: "genai",
        api_user: process.env.SIGHTENGINE_API_USER,
        api_secret: process.env.SIGHTENGINE_API_SECRET,
      });

      const fullUrl = `https://api.sightengine.com/1.0/check.json?${params}`;
      console.log("📡 SightEngine URL:", fullUrl); // ← see full request

      https.get(fullUrl, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          console.log("📨 SightEngine response:", data); // ← see raw response
          try {
            const json = JSON.parse(data);
            console.log("🤖 AI Score:", json.type?.ai_generated ?? 0);
            resolve(json.type?.ai_generated ?? 0);
          } catch {
            console.error("❌ JSON parse failed:", data);
            resolve(0);
          }
        });
      }).on("error", (err) => {
        console.error("❌ HTTPS request failed:", err.message);
        resolve(0);
      });

    } catch (err) {
      console.error("❌ checkAIImage crashed:", err.message);
      resolve(0);
    }
  });
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
    console.log("🤖 AI Score:", aiScore);
    if (aiScore > 0.5) {
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