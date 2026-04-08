const express = require("express");

const { ping } = require("../../controllers/ping.controller");
const authRoutes = require("./auth.routes");
const aiRoutes = require("./ai.routes");
const reportRoutes = require("./report.routes"); // ✅ ADD THIS

const router = express.Router();

router.get("/ping", ping);
router.use("/auth", authRoutes);
router.use("/ai", aiRoutes);
router.use("/reports", reportRoutes); // ✅ ADD THIS

module.exports = router;