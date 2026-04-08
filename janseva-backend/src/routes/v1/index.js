const express = require("express");

const { ping }        = require("../../controllers/ping.controller");
const authRoutes      = require("./auth.routes");
const aiRoutes        = require("./ai.routes");
const reportRoutes    = require("./report.routes");
const trendingRoutes  = require("./trending.routes");
const mapRoutes       = require("./map.routes");
const govRoutes       = require("./gov.routes");

const router = express.Router();

// ✅ Health check
router.get("/ping", ping);

// ✅ Ordered: auth first, then features, gov last (most restricted)
router.use("/auth",     authRoutes);
router.use("/ai",       aiRoutes);
router.use("/reports",  reportRoutes);
router.use("/trending", trendingRoutes);
router.use("/map",      mapRoutes);
router.use("/gov",      govRoutes);

module.exports = router;