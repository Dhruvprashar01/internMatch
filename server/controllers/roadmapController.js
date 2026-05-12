/**
 * controllers/roadmapController.js — Readiness Roadmap API
 */
"use strict";

const Candidate  = require("../models/Candidate");
const Internship = require("../models/Internship");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { calculateMatchScore }    = require("../services/matchingEngine");
const { generateRoadmap }        = require("../services/roadmapService");
const mongoose = require("mongoose");

/**
 * @route   GET /api/roadmap/:internshipId
 * @desc    Generate a personalized readiness roadmap for a candidate + internship
 * @access  Private (candidate)
 */
const getRoadmap = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.internshipId)) {
      return sendError(res, 400, "Invalid internship ID");
    }

    const [candidate, internship] = await Promise.all([
      Candidate.findOne({ user: req.user._id }).lean(),
      Internship.findById(req.params.internshipId)
        .populate("company", "companyName industry")
        .lean(),
    ]);

    if (!candidate)  return sendError(res, 404, "Candidate profile not found");
    if (!internship) return sendError(res, 404, "Internship not found");

    if (!candidate.skills || candidate.skills.length === 0) {
      return sendError(res, 400, "Please add skills to your profile first to generate a roadmap");
    }

    // Get current match score
    const matchResult  = calculateMatchScore(candidate, internship);
    const matchScore   = Number.isFinite(matchResult?.score) ? matchResult.score : 0;

    // Generate AI roadmap
    const roadmap = await generateRoadmap(candidate, internship, matchScore);

    return sendSuccess(res, 200, "Roadmap generated", {
      internship: {
        _id:         internship._id,
        title:       internship.title,
        company:     internship.company?.companyName,
        location:    internship.location,
        duration:    internship.duration,
        requiredSkills: internship.requiredSkills,
      },
      roadmap,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRoadmap };