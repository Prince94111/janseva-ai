const express = require("express");

const {
  getPriorityQueue,
  getDepartmentQueue,
  postOfficialResponse,
  getDashboardStats,
} = require("../../controllers/gov.controller");
const { protect }    = require("../../middleware/auth.middleware");
const { roleGuard }  = require("../../middleware/role.middleware");

const router = express.Router();

// ✅ All gov routes require login + officer role
router.use(protect, roleGuard("officer"));

router.get("/stats",          getDashboardStats);     // ✅ stats before /:id
router.get("/priority",       getPriorityQueue);
router.get("/department",     getDepartmentQueue);
router.post("/:id/response",  postOfficialResponse);

module.exports = router;