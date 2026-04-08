const { generateText } = require("../../config/groq");

const SEVERITIES = new Set(["low", "medium", "high", "critical"]);

const FALLBACK = {
  severity: "low",
  confidence: 0,
};

function parseModelJson(raw) {
  if (raw == null) return null;
  let text = String(raw).trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeConfidence(value) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(1, Math.max(0, n));
}

function normalizeResult(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const severity =
    typeof parsed.severity === "string" ? parsed.severity.trim().toLowerCase() : "";
  if (!SEVERITIES.has(severity)) return null;
  const confidence = normalizeConfidence(parsed.confidence);
  if (confidence === null) return null;
  return { severity, confidence };
}

async function scoreSeverity({ title, description, category }) {
  const safeTitle = typeof title === "string" ? title : "";
  const safeDesc = typeof description === "string" ? description : "";
  const safeCategory = typeof category === "string" ? category : "";

  const prompt = `You evaluate civic issue reports from citizens in India.

Report title: ${JSON.stringify(safeTitle)}
Report description: ${JSON.stringify(safeDesc)}
Issue category (slug): ${JSON.stringify(safeCategory)}

Assess severity using:
- urgency (how soon action is needed)
- safety risk (harm to people, animals, or property)
- scale of impact (how many people or how large an area is affected)

Be strict and avoid guessing. Base your answer only on the provided report.

Return a single JSON object with:
- "severity": exactly one of "low", "medium", "high", "critical"
- "confidence": a number from 0 to 1 (your certainty in this assessment)

Respond with ONLY valid JSON. No markdown. No explanation. No code blocks.`;

  try {
    const text = await generateText(prompt);
    const parsed = parseModelJson(text);
    const normalized = normalizeResult(parsed);
    return normalized ?? { ...FALLBACK };
  } catch (err) {
    console.error("Severity error:", err.message);
    return { ...FALLBACK };
  }
}

module.exports = { scoreSeverity };
