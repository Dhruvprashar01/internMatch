/**
 * controllers/candidateController.js — Candidate Profile Management
 */
const Candidate = require("../models/Candidate");
const User = require("../models/User");
const { sendSuccess, sendError, sendPaginated } = require("../utils/responseHandler");
const { getPaginationOptions } = require("../utils/helpers");

/**
 * @route   GET /api/candidates/profile
 * @desc    Get own candidate profile
 * @access  Private (candidate)
 */
const getProfile = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user._id })
      .populate("user", "name email avatar createdAt");

    if (!candidate) return sendError(res, 404, "Candidate profile not found");
    return sendSuccess(res, 200, "Profile fetched", candidate);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/candidates/profile
 * @desc    Update candidate profile
 * @access  Private (candidate)
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "phone", "bio", "skills", "locationPreferences", "currentLocation",
      "education", "experience", "projects", "experienceLevel", "availability",
      "diversityCategory", "linkedIn", "github", "portfolio",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const candidate = await Candidate.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("user", "name email");

    if (!candidate) return sendError(res, 404, "Candidate profile not found");

    // Update profileCompleted flag on User
    const completion = candidate.profileCompletion;
    if (completion >= 60) {
      await User.findByIdAndUpdate(req.user._id, { profileCompleted: true });
    }

    return sendSuccess(res, 200, "Profile updated", candidate);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/candidates/:id
 * @desc    Get candidate by ID (company/admin view)
 * @access  Private (company, admin)
 */
const getCandidateById = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate("user", "name email avatar");

    if (!candidate) return sendError(res, 404, "Candidate not found");
    return sendSuccess(res, 200, "Candidate fetched", candidate);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/candidates
 * @desc    Get all candidates (admin)
 * @access  Private (admin)
 */
const getAllCandidates = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const { skill, category, location } = req.query;

    const filter = {};
    if (skill) filter.skills = { $in: [new RegExp(skill, "i")] };
    if (category) filter.diversityCategory = category;
    if (location) filter.currentLocation = new RegExp(location, "i");

    const [candidates, total] = await Promise.all([
      Candidate.find(filter)
        .populate("user", "name email createdAt")
        .sort("-createdAt")
        .skip(skip)
        .limit(limit),
      Candidate.countDocuments(filter),
    ]);

    return sendPaginated(res, candidates, page, limit, total);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/candidates/save-internship/:internshipId
 * @desc    Save/unsave an internship
 * @access  Private (candidate)
 */
const toggleSaveInternship = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user._id });
    if (!candidate) return sendError(res, 404, "Candidate not found");

    const id = req.params.internshipId;
    const isSaved = candidate.savedInternships.includes(id);

    if (isSaved) {
      candidate.savedInternships.pull(id);
    } else {
      candidate.savedInternships.push(id);
    }

    await candidate.save();
    return sendSuccess(res, 200, isSaved ? "Internship removed from saved" : "Internship saved", {
      saved: !isSaved,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getCandidateById, getAllCandidates, toggleSaveInternship };
