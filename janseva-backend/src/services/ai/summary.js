const { generateText } = require("../../config/groq");

const FALLBACK = {
  insights:
    "Inspect the reported issue and initiate necessary corrective action as per department guidelines.",
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

function normalizeResult(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const insights =
    typeof parsed.insights === "string" ? parsed.insights.trim() : "";
  if (!insights || insights.length < 20) return null;
  return { insights };
}

async function generateSummary({ title, description, category, severity }) {
  const safeTitle = typeof title === "string" ? title : "";
  const safeDescription = typeof description === "string" ? description : "";
  const safeCategory = typeof category === "string" ? category : "";
  const safeSeverity = typeof severity === "string" ? severity : "";

  const prompt = `You are assisting a government officer in Uttarakhand reviewing a civic issue report.

Report title: ${JSON.stringify(safeTitle)}
Report description: ${JSON.stringify(safeDescription)}
Issue category: ${JSON.stringify(safeCategory)}
Severity: ${JSON.stringify(safeSeverity)}

Write exactly 2 actionable insights for government response.

Rules:
- Each insight must be one short sentence
- Focus on practical actions (inspection, repair, safety measures)
- If severity is "high" or "critical", prioritize urgent actions
- Keep context relevant to Uttarakhand
- Do not merge both insights into one sentence

Return ONLY valid JSON in this format:
{"insights": "First insight. Second insight."}

No markdown. No explanation.`;

  try {
    const text = await generateText(prompt);
    const parsed = parseModelJson(text);
    const normalized = normalizeResult(parsed);
    return normalized ?? { ...FALLBACK };
  } catch {
    return { ...FALLBACK };
  }
}

module.exports = { generateSummary };
