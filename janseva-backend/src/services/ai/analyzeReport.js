const { classifyReport } = require("./classify");
const { scoreSeverity } = require("./severity");
const { generateSummary } = require("./summary");

const FALLBACK = {
  category: "other",
  severity: "low",
  confidence: 0,
  insights: "Analysis unavailable",
  suggestedDepartment: "General Administration",
};

function isValidClassification(r) {
  return (
    r &&
    typeof r === "object" &&
    typeof r.category === "string" &&
    typeof r.suggestedDepartment === "string"
  );
}

function isValidSeverity(r) {
  return (
    r &&
    typeof r === "object" &&
    typeof r.severity === "string" &&
    typeof r.confidence === "number" &&
    Number.isFinite(r.confidence)
  );
}

function isValidSummary(r) {
  return r && typeof r === "object" && typeof r.insights === "string";
}

async function analyzeReport({ title, description }) {
  let result = { ...FALLBACK };

  try {
    // 🔹 Step 1: Classification
    const classification = await classifyReport({ title, description });
    if (isValidClassification(classification)) {
      result.category = classification.category;
      result.suggestedDepartment = classification.suggestedDepartment;
    }

    // 🔹 Step 2: Severity
    const severityResult = await scoreSeverity({
      title,
      description,
      category: result.category,
    });

    if (isValidSeverity(severityResult)) {
      result.severity = severityResult.severity;
      result.confidence = severityResult.confidence;
    }

    // 🔹 Step 3: Summary
    const summaryResult = await generateSummary({
      title,
      description,
      category: result.category,
      severity: result.severity,
    });

    if (isValidSummary(summaryResult)) {
      result.insights = summaryResult.insights;
    }

    return result;
  } catch (err) {
    console.error("AnalyzeReport error:", err.message);
    return result; // 🔥 return partial result, not full fallback
  }
}

module.exports = { analyzeReport };