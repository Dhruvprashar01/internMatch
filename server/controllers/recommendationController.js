/**
 * controllers/recommendationController.js — AI Recommendations
 */
const Candidate = require("../models/Candidate");
const Internship = require("../models/Internship");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { getTopRecommendations } = require("../services/matchingEngine");
const { applyFairnessReranking } = require("../services/fairnessService");
const { generateMatchExplanation } = require("../services/geminiService");

/**
 * @route   GET /api/recommendations
 * @desc    Get top 10 recommended internships for a candidate
 * @access  Private (candidate)
 */
const getRecommendations = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user._id });
    if (!candidate) return sendError(res, 404, "Candidate profile not found");

    if (!candidate.skills || candidate.skills.length === 0) {
      return sendError(res, 400, "Please add skills to your profile to get recommendations");
    }

    // Fetch active internships not already applied to
    const activeInternships = await Internship.find({
      status: "active",
      _id: { $nin: candidate.appliedInternships },
    }).populate("company", "companyName logo industry headquarters");

    if (activeInternships.length === 0) {
      return sendSuccess(res, 200, "No new internships available", []);
    }

    // Step 1: Score all internships
    const scored = getTopRecommendations(candidate, activeInternships, 20);

    // Step 2: Apply fairness re-ranking
    const reranked = applyFairnessReranking(scored, candidate.diversityCategory, 10);

    // Step 3: Generate AI explanations for top 10
    const withExplanations = await Promise.all(
      reranked.map(async (item) => {
        let explanation = null;
        try {
          explanation = await generateMatchExplanation(candidate, item.internship, item.score);
        } catch (e) {
          explanation = `Your skills match ${Math.round(item.score)}% of this internship's requirements.`;
        }
        return { ...item, explanation };
      })
    );

    return sendSuccess(res, 200, "Recommendations generated", withExplanations);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/recommendations/explain/:internshipId
 * @desc    Get detailed AI explanation for a specific internship match
 * @access  Private (candidate)
 */
const getExplanation = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user._id });
    const internship = await Internship.findById(req.params.internshipId)
      .populate("company", "companyName industry");

    if (!candidate || !internship) return sendError(res, 404, "Resource not found");

    const { calculateMatchScore } = require("../services/matchingEngine");
    const score = calculateMatchScore(candidate, internship);
    const explanation = await generateMatchExplanation(candidate, internship, score);

    return sendSuccess(res, 200, "Explanation generated", { score: Math.round(score), explanation });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecommendations, getExplanation };
