/**
 * controllers/authController.js
 * ADDED: googleCallback handler for OAuth flow
 */
"use strict";

const User      = require("../models/User");
const Candidate = require("../models/Candidate");
const Company   = require("../models/Company");
const { generateToken } = require("../middleware/auth");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { logger } = require("../middleware/logger");

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 409, "An account with this email already exists");

    const user = await User.create({ name, email, password, role, authProvider: "local" });

    if (role === "candidate") {
      await Candidate.create({ user: user._id });
    } else if (role === "company") {
      await Company.create({ user: user._id, companyName: name });
    }

    const token = generateToken(user._id, user.role);
    logger.info(`New user registered: ${email} (${role})`);

    return sendSuccess(res, 201, "Account created successfully", {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, profileCompleted: user.profileCompleted },
    });
  } catch (error) { next(error); }
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return sendError(res, 401, "Invalid email or password");

    // Google-only account trying to log in with password
    if (user.authProvider === "google" && !user.password) {
      return sendError(res, 400, "This account uses Google Sign-In. Please click 'Continue with Google'.");
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return sendError(res, 401, "Invalid email or password");

    if (!user.isActive) return sendError(res, 403, "Your account has been deactivated");

    await user.updateLastLogin();
    const token = generateToken(user._id, user.role);
    logger.info(`User logged in: ${email}`);

    return sendSuccess(res, 200, "Login successful", {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, profileCompleted: user.profileCompleted },
    });
  } catch (error) { next(error); }
};

// ── Google OAuth Callback ─────────────────────────────────────────────────────
/**
 * Called by Passport after Google verifies the user.
 * Generates a JWT and redirects to the frontend with the token in the URL.
 * Frontend picks it up and stores it in localStorage.
 */
const googleCallback = async (req, res) => {
  try {
    const user  = req.user; // set by Passport strategy
    if (!user)  return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=google_failed`);

    await user.updateLastLogin();
    const token = generateToken(user._id, user.role);

    // Redirect to frontend with token — frontend will store it
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    res.redirect(`${clientUrl}/auth/google/success?token=${token}&role=${user.role}`);
  } catch (err) {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    res.redirect(`${clientUrl}/login?error=google_failed`);
  }
};

// ── Get Me ────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;
    if (user.role === "candidate") profile = await Candidate.findOne({ user: user._id });
    else if (user.role === "company") profile = await Company.findOne({ user: user._id });
    return sendSuccess(res, 200, "User fetched", { user, profile });
  } catch (error) { next(error); }
};

// ── Change Password ───────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (user.authProvider === "google" && !user.password) {
      return sendError(res, 400, "Google accounts cannot change password here. Set a password first.");
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return sendError(res, 400, "Current password is incorrect");

    user.password = newPassword;
    await user.save();
    return sendSuccess(res, 200, "Password changed successfully");
  } catch (error) { next(error); }
};

module.exports = { register, login, googleCallback, getMe, changePassword };