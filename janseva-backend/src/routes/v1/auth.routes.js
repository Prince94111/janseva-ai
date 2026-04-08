const express = require("express");
const { body } = require("express-validator");

const {
  register,
  login,
  getMe,
} = require("../../controllers/auth.controller");
const { protect } = require("../../middleware/auth.middleware");
const { USER_ROLES } = require("../../models/user.model");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("email").isEmail().withMessage("valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("password must be at least 6 characters"),
    body("role")
      .isIn([USER_ROLES.CITIZEN, USER_ROLES.OFFICER])
      .withMessage("role must be citizen or officer"),
  ],
  register
);

router.post(
  "/login",
  [
    body("email").trim().notEmpty().withMessage("email is required").isEmail().withMessage("valid email is required"),
    body("password").notEmpty().withMessage("password is required"),
  ],
  login
);

router.get("/me", protect, getMe);

module.exports = router;
