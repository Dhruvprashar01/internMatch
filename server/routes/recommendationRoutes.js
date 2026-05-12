const express = require("express");
const router = express.Router();
const { getRecommendations, getExplanation } = require("../controllers/recommendationController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");
const { aiRateLimiter } = require("../middleware/rateLimiter");

router.get("/", protect, authorize("candidate"), aiRateLimiter, getRecommendations);
router.get("/explain/:internshipId", protect, authorize("candidate"), aiRateLimiter, getExplanation);

module.exports = router;
