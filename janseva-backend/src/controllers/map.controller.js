const { getHeatmapMarkers } = require("../services/trending/heatmap");

async function getMarkers(req, res) {
  try {
    const data = await getHeatmapMarkers();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getMarkers };