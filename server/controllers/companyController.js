/**
 * controllers/companyController.js
 * ADDED: requestVerification — company submits verification request
 */
"use strict";

const Company = require("../models/Company");
const User    = require("../models/User");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { getPaginationOptions }   = require("../utils/helpers");

const getProfile = async (req, res, next) => {
  try {
    const company = await Company.findOne({ user: req.user._id }).populate("user", "name email createdAt");
    if (!company) return sendError(res, 404, "Company profile not found");
    return sendSuccess(res, 200, "Company profile fetched", company);
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "companyName","description","industry","website","headquarters",
      "size","founded","linkedIn","contactEmail","contactPhone",
    ];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const company = await Company.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("user", "name email");

    if (!company) return sendError(res, 404, "Company not found");
    await User.findByIdAndUpdate(req.user._id, { profileCompleted: true });
    return sendSuccess(res, 200, "Company profile updated", company);
  } catch (error) { next(error); }
};

/**
 * POST /api/companies/request-verification
 * Company submits docs for admin review
 */
const requestVerification = async (req, res, next) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    if (!company) return sendError(res, 404, "Company profile not found");

    if (company.verificationStatus === "verified") {
      return sendError(res, 400, "Your company is already verified");
    }
    if (company.verificationStatus === "pending") {
      return sendError(res, 400, "Verification already pending. Admin will review soon.");
    }

    const { gstNumber, linkedInUrl, websiteUrl } = req.body;

    company.verificationStatus      = "pending";
    company.verificationRequestedAt = new Date();
    company.verificationNote        = null;
    company.verificationDocs        = {
      gstNumber:   gstNumber   || company.verificationDocs?.gstNumber   || null,
      linkedInUrl: linkedInUrl || company.linkedIn                       || null,
      websiteUrl:  websiteUrl  || company.website                        || null,
    };

    await company.save();
    return sendSuccess(res, 200, "Verification request submitted! Admin will review within 24-48 hours.", {
      verificationStatus: "pending",
    });
  } catch (error) { next(error); }
};

const getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate("user", "name email").populate("internships");
    if (!company) return sendError(res, 404, "Company not found");
    return sendSuccess(res, 200, "Company fetched", company);
  } catch (error) { next(error); }
};

const getAllCompanies = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const { industry, search } = req.query;
    const filter = {};
    if (industry) filter.industry = new RegExp(industry, "i");
    if (search)   filter.$text = { $search: search };

    const [companies, total] = await Promise.all([
      Company.find(filter).populate("user", "name email").sort("-createdAt").skip(skip).limit(limit),
      Company.countDocuments(filter),
    ]);
    const { sendPaginated } = require("../utils/responseHandler");
    return sendPaginated(res, companies, page, limit, total);
  } catch (error) { next(error); }
};

module.exports = { getProfile, updateProfile, requestVerification, getCompanyById, getAllCompanies };