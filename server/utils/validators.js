/**
 * utils/validators.js — express-validator rule sets
 */
const { body, param, query } = require("express-validator");

const authValidators = {
  register: [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 100 }),
    body("email").trim().isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain uppercase, lowercase, and a number"),
    body("role")
      .isIn(["candidate", "company", "admin"])
      .withMessage("Role must be candidate, company, or admin"),
  ],
  login: [
    body("email").trim().isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
};

const candidateValidators = {
  updateProfile: [
    body("phone").optional().isMobilePhone().withMessage("Valid phone number required"),
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("locationPreferences").optional().isArray().withMessage("Location preferences must be an array"),
  ],
};

const internshipValidators = {
  create: [
    body("title").trim().notEmpty().withMessage("Internship title is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("requiredSkills").isArray({ min: 1 }).withMessage("At least one skill required"),
    body("duration").trim().notEmpty().withMessage("Duration is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("stipend").optional().isNumeric().withMessage("Stipend must be a number"),
    body("openings").isInt({ min: 1 }).withMessage("Openings must be at least 1"),
  ],
};

const mongoIdValidator = (field = "id") =>
  param(field).isMongoId().withMessage(`Invalid ${field}`);

module.exports = { authValidators, candidateValidators, internshipValidators, mongoIdValidator };
