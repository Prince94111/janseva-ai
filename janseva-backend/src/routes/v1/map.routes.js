const express = require("express");

const { getMarkers } = require("../../controllers/map.controller");

const router = express.Router();

// Public — no auth needed, citizens see the map
router.get("/markers", getMarkers);

module.exports = router;