const express = require("express");

const { getTrending } = require("../../controllers/trending.controller");

const router = express.Router();

// Public — trending districts visible to everyone
router.get("/", getTrending);

module.exports = router;