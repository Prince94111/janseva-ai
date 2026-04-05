const express = require("express");

const { ping } = require("../../controllers/ping.controller");
const authRoutes = require("./auth.routes");

const router = express.Router();

router.get("/ping", ping);
router.use("/auth", authRoutes);

module.exports = router;

