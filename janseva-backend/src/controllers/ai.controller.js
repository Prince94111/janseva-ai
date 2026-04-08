const { analyzeReport } = require("../services/ai/analyzeReport");

async function analyzeReportController(req, res) {
  try {
    let { title, description } = req.body;

    // 🔹 Basic validation
    if (
      !title ||
      typeof title !== "string" ||
      !description ||
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required and must be strings",
      });
    }

    // 🔹 Trim input (important)
    title = title.trim();
    description = description.trim();

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description cannot be empty",
      });
    }

    // 🔹 Optional: limit size (prevents abuse)
    if (title.length > 200 || description.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Input too long",
      });
    }

    // 🔹 Call AI service
    const result = await analyzeReport({ title, description });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI CONTROLLER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while analyzing report",
    });
  }
}

module.exports = { analyzeReportController };