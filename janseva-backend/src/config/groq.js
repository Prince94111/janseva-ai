const Groq = require("groq-sdk");

if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateText(prompt) {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });
    return response.choices[0].message.content;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Groq error:", err);
    return null;
  }
}

module.exports = { generateText };
