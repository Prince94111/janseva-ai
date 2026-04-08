const { generateText } = require("../../config/groq");

const CATEGORIES = new Set([
  "road_damage",
  "women_safety",
  "wildlife",
  "pilgrimage",
  "water",
  "electricity",
  "sanitation",
  "other",
]);

const FALLBACK = {
  category: "other",
  suggestedDepartment: "General Administration",
};

function parseClassificationJson(raw) {
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
  const category =
    typeof parsed.category === "string" ? parsed.category.trim() : "";
  const dept =
    typeof parsed.suggestedDepartment === "string"
      ? parsed.suggestedDepartment.trim()
      : "";
  if (!CATEGORIES.has(category) || !dept) return null;
  return { category, suggestedDepartment: dept };
}

async function classifyReport({ title, description }) {
  const safeTitle = typeof title === "string" ? title : "";
  const safeDesc = typeof description === "string" ? description : "";

  const prompt = `You classify civic issues reported by citizens in India.

Report title: ${JSON.stringify(safeTitle)}
Report description: ${JSON.stringify(safeDesc)}

Pick exactly one category (use this exact slug):
road_damage, women_safety, wildlife, pilgrimage, water, electricity, sanitation, other

Suggest one realistic Indian government department (state/district/municipal or central) that would typically handle this issue.

Output format — a single JSON object with keys "category" and "suggestedDepartment" only.

Respond with ONLY valid JSON. No markdown. No explanation. No code blocks.`;

  try {
    const text = await generateText(prompt);

    const parsed = parseClassificationJson(text);
    const normalized = normalizeResult(parsed);
    return normalized ?? { ...FALLBACK };
  } catch (err) {
    console.error("CLASSIFY ERROR:", err); 
    return { ...FALLBACK };
  }
}

module.exports = { classifyReport };
