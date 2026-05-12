/**
 * middleware/auth.js — JWT Authentication Middleware
 * FIXED: Also accepts token from query param ?token= 
 *        (needed for certificate download via window.open)
 */
const jwt  = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../utils/responseHandler");

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header (normal API calls)
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Check query param (used for file downloads via window.open)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return sendError(res, 401, "Access denied. No token provided.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select("-password");

    if (!user)         return sendError(res, 401, "Token is valid but user no longer exists.");
    if (!user.isActive)return sendError(res, 401, "Your account has been deactivated.");

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") return sendError(res, 401, "Token has expired. Please log in again.");
    if (error.name === "JsonWebTokenError") return sendError(res, 401, "Invalid token.");
    return sendError(res, 500, "Authentication error.");
  }
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

module.exports = { protect, generateToken };