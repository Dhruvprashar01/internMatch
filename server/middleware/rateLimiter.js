/**
 * middleware/rateLimiter.js — API Rate Limiting
 */
const rateLimit = require("express-rate-limit");

// Global limiter — 200 requests per 15 minutes per IP
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// Strict limiter for auth routes — 10 attempts per 15 minutes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// Gemini AI calls — limit to avoid excessive API costs
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    message: "Too many AI requests. Please slow down.",
  },
});

module.exports = { globalRateLimiter, authRateLimiter, aiRateLimiter };
