/**
 * controllers/adminController.js
 * ADDED: verifyCompany, rejectCompany, getPendingVerifications
 */
"use strict";

const User        = require("../models/User");
const Candidate   = require("../models/Candidate");
const Company     = require("../models/Company");
const Internship  = require("../models/Internship");
const Application = require("../models/Application");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const mongoose = require("mongoose");

// ── Platform Stats ────────────────────────────────────────────────────────────
const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalCandidates, totalCompanies,
      totalInternships, activeInternships, totalApplications,
      recentUsers, applicationsByStatus, pendingVerifications,
    ] = await Promise.all([
      User.countDocuments(),
      Candidate.countDocuments(),
      Company.countDocuments(),
      Internship.countDocuments(),
      Internship.countDocuments({ status: "active" }),
      Application.countDocuments(),
      User.find().sort("-createdAt").limit(5).select("name email role createdAt isActive"),
      Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Company.countDocuments({ verificationStatus: "pending" }),
    ]);

    return sendSuccess(res, 200, "Platform stats", {
      overview: {
        totalUsers, totalCandidates, totalCompanies,
        totalInternships, activeInternships, totalApplications,
        pendingVerifications,
      },
      recentUsers,
      applicationsByStatus,
    });
  } catch (error) { next(error); }
};

// ── Diversity Stats ───────────────────────────────────────────────────────────
const getDiversityStats = async (req, res, next) => {
  try {
    const [diversityBreakdown, applicationsByCategory] = await Promise.all([
      Candidate.aggregate([
        { $group: { _id: "$diversityCategory", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Application.aggregate([
        { $lookup: { from: "candidates", localField: "candidate", foreignField: "_id", as: "candidateData" } },
        { $unwind: "$candidateData" },
        { $group: { _id: { category: "$candidateData.diversityCategory", status: "$status" }, count: { $sum: 1 } } },
      ]),
    ]);
    return sendSuccess(res, 200, "Diversity stats", { diversityBreakdown, applicationsByCategory });
  } catch (error) { next(error); }
};

// ── Users ─────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;
    const filter = {};
    if (role && role !== "all") filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: re }, { email: re }];
    }
    const users = await User.find(filter).sort("-createdAt").limit(200).lean();
    return sendSuccess(res, 200, "Users fetched", users);
  } catch (error) { next(error); }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return sendError(res, 400, "Invalid user ID");
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, "User not found");
    if (user.role === "admin") return sendError(res, 403, "Cannot deactivate an admin");
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    return sendSuccess(res, 200, `User ${user.isActive ? "activated" : "deactivated"}`, { isActive: user.isActive });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return sendError(res, 400, "Invalid user ID");
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, "User not found");
    if (user.role === "admin") return sendError(res, 403, "Cannot delete an admin");
    await Promise.all([
      Candidate.deleteOne({ user: user._id }),
      Company.deleteOne({ user: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);
    return sendSuccess(res, 200, "User deleted");
  } catch (error) { next(error); }
};

// ── Internships ───────────────────────────────────────────────────────────────
const getAllInternships = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: re }];
    }
    const internships = await Internship.find(filter)
      .populate("company", "companyName isVerified verificationStatus")
      .sort("-createdAt").limit(200).lean();
    return sendSuccess(res, 200, "Internships fetched", internships);
  } catch (error) { next(error); }
};

const deleteInternship = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return sendError(res, 400, "Invalid internship ID");
    const internship = await Internship.findByIdAndDelete(req.params.id);
    if (!internship) return sendError(res, 404, "Internship not found");
    return sendSuccess(res, 200, "Internship deleted");
  } catch (error) { next(error); }
};

// ── Applications ──────────────────────────────────────────────────────────────
const getAllApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    const applications = await Application.find(filter)
      .populate({ path: "candidate", populate: { path: "user", select: "name email" } })
      .populate({ path: "internship", select: "title", populate: { path: "company", select: "companyName" } })
      .sort("-createdAt").limit(200).lean();
    return sendSuccess(res, 200, "Applications fetched", applications);
  } catch (error) { next(error); }
};

// ── Company Verification ──────────────────────────────────────────────────────
/**
 * GET /api/admin/verifications — Get all companies pending verification
 */
const getPendingVerifications = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;
    const filter = {};
    if (status !== "all") filter.verificationStatus = status;

    const companies = await Company.find(filter)
      .populate("user", "name email createdAt")
      .sort("-verificationRequestedAt")
      .lean();

    return sendSuccess(res, 200, "Verification requests fetched", companies);
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/verifications/:companyId/approve
 */
const verifyCompany = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.companyId))
      return sendError(res, 400, "Invalid company ID");

    const company = await Company.findById(req.params.companyId);
    if (!company) return sendError(res, 404, "Company not found");

    company.isVerified           = true;
    company.verificationStatus   = "verified";
    company.verifiedAt           = new Date();
    company.verifiedBy           = req.user._id;
    company.verificationNote     = null;
    await company.save();

    return sendSuccess(res, 200, "Company verified successfully ✓", {
      companyName: company.companyName,
      isVerified:  true,
    });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/verifications/:companyId/reject
 */
const rejectVerification = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.companyId))
      return sendError(res, 400, "Invalid company ID");

    const { note } = req.body;
    const company = await Company.findById(req.params.companyId);
    if (!company) return sendError(res, 404, "Company not found");

    company.isVerified         = false;
    company.verificationStatus = "rejected";
    company.verificationNote   = note || "Verification rejected by admin";
    await company.save();

    return sendSuccess(res, 200, "Verification rejected", { companyName: company.companyName });
  } catch (error) { next(error); }
};

module.exports = {
  getPlatformStats, getDiversityStats,
  getAllUsers, toggleUserStatus, deleteUser,
  getAllInternships, deleteInternship,
  getAllApplications,
  getPendingVerifications, verifyCompany, rejectVerification,
};