/**
 * utils/validators.js — express-validator rule sets
 *
 * FIXES:
 *  [F18] Admin role blocked from public registration endpoint
 *  [F19] newPassword validated on change-password route
 *  [F20] Skills/LocationPreferences arrays length-capped (prevents DoS)
 *  [F21] Skill strings length-validated (prevents injection payloads)
 *  [F22] mongoIdValidator exposed for route-level ObjectId checks
 */
"use strict";

const { body, param } = require("express-validator");

const authValidators = {
  register: [
    body("name")
      .trim()
      .notEmpty().withMessage("Name is required")
      .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),
    body("email")
      .trim()
      .isEmail().withMessage("Valid email required")
      .normalizeEmail()
      .isLength({ max: 254 }).withMessage("Email too long"),
    body("password")
      .isLength({ min: 8, max: 128 }).withMessage("Password must be at least 8 characters"),
    // [F18] Prevent public admin registration
    body("role")
      .isIn(["candidate", "company"]).withMessage("Role must be candidate or company"),
  ],
  login: [
    body("email")
      .trim()
      .isEmail().withMessage("Valid email required")
      .normalizeEmail(),
    body("password")
      .notEmpty().withMessage("Password is required")
      .isLength({ max: 128 }).withMessage("Password too long"),
  ],
  // [F19] Change password — validate new password strength
  changePassword: [
    body("currentPassword")
      .notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8, max: 128 }).withMessage("New password must be at least 8 characters"),
  ],
};

const candidateValidators = {
  updateProfile: [
    body("phone").optional().isMobilePhone().withMessage("Valid phone required"),
    // [F20] Array size caps
    body("skills")
      .optional()
      .isArray({ max: 60 }).withMessage("Max 60 skills allowed"),
    body("skills.*")
      // [F21] Each skill string
      .optional()
      .trim()
      .isLength({ min: 1, max: 60 }).withMessage("Each skill must be 1–60 characters")
      .matches(/^[a-zA-Z0-9 .#+\-_/]+$/).withMessage("Skill contains invalid characters"),
    body("locationPreferences")
      .optional()
      .isArray({ max: 10 }).withMessage("Max 10 location preferences"),
    body("locationPreferences.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }),
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage("Bio must be under 500 characters"),
    body("linkedIn").optional().trim().isURL().withMessage("Invalid LinkedIn URL"),
    body("github").optional().trim().isURL().withMessage("Invalid GitHub URL"),
  ],
};

const internshipValidators = {
  create: [
    body("title")
      .trim()
      .notEmpty().withMessage("Internship title is required")
      .isLength({ max: 150 }),
    body("description")
      .trim()
      .notEmpty().withMessage("Description is required")
      .isLength({ max: 5000 }),
    body("requiredSkills")
      .isArray({ min: 1, max: 30 }).withMessage("1–30 required skills"),
    body("requiredSkills.*")
      .trim()
      .isLength({ min: 1, max: 60 }),
    body("duration")
      .trim()
      .notEmpty().withMessage("Duration is required")
      .isLength({ max: 50 }),
    body("location")
      .trim()
      .notEmpty().withMessage("Location is required")
      .isLength({ max: 100 }),
    body("stipend")
      .optional()
      .isInt({ min: 0, max: 999999 }).withMessage("Stipend must be 0–999999"),
    body("openings")
      .isInt({ min: 1, max: 100 }).withMessage("Openings must be 1–100"),
    body("applicationDeadline")
      .optional()
      .isISO8601().withMessage("Invalid deadline date"),
  ],
};

// Reusable MongoID param validator
const mongoIdValidator = (field = "id") =>
  param(field).isMongoId().withMessage(`Invalid ${field}`);

module.exports = { authValidators, candidateValidators, internshipValidators, mongoIdValidator };