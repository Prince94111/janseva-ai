const { getTrendingDistricts } = require("../services/trending/aggregation");

async function getTrending(req, res) {
  try {
    // ✅ FIXED: parse as int, guard against bad input, pass limit through
    const period = Math.max(Number.parseInt(req.query.period, 10) || 7, 1);
    const limit  = Math.min(Number.parseInt(req.query.limit,  10) || 13, 13);

    const data = await getTrendingDistricts(period, limit);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getTrending };