"use strict";
const express  = require("express");
const router   = express.Router();
const { getRoadmap } = require("../controllers/roadmapController");
const { protect }    = require("../middleware/auth");
const { authorize }  = require("../middleware/roleCheck");
const { aiRateLimiter } = require("../middleware/rateLimiter");

// Rate limited — Gemini call per request
router.get("/:internshipId", protect, authorize("candidate"), aiRateLimiter, getRoadmap);

module.exports = router;