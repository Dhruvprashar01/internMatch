/**
 * middleware/roleCheck.js — Role-Based Access Control
 */
const { sendError } = require("../utils/responseHandler");

/**
 * Restrict access to specific roles
 * Usage: authorize("admin"), authorize("candidate", "admin")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required.");
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}`
      );
    }
    next();
  };
};

module.exports = { authorize };
