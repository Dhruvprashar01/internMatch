"use strict";

const express  = require("express");
const router   = express.Router();
const passport = require("../config/passport");
const { register, login, googleCallback, getMe, changePassword } = require("../controllers/authController");
const { protect }       = require("../middleware/auth");
const { authValidators }= require("../utils/validators");
const { validate }      = require("../middleware/validate");
const { authRateLimiter }= require("../middleware/rateLimiter");

// ── Standard auth ─────────────────────────────────────────────────────────────
router.post("/register",        authRateLimiter, authValidators.register, validate, register);
router.post("/login",           authRateLimiter, authValidators.login,    validate, login);
router.get ("/me",              protect, getMe);
router.put ("/change-password", protect, changePassword);

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Step 1: Redirect user to Google consent screen
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Step 2: Google redirects back here with auth code
router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=google_failed" }),
  googleCallback
);

module.exports = router;