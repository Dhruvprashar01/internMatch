/**
 * controllers/internshipController.js — Internship CRUD
 */
const Internship = require("../models/Internship");
const Company = require("../models/Company");
const { sendSuccess, sendError, sendPaginated } = require("../utils/responseHandler");
const { getPaginationOptions, getSortOption } = require("../utils/helpers");

const ALLOWED_SORT = ["createdAt", "stipend", "applicationDeadline", "applicationCount"];

/**
 * @route   POST /api/internships
 * @desc    Post a new internship
 * @access  Private (company)
 */
const createInternship = async (req, res, next) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    if (!company) return sendError(res, 404, "Company profile not found. Please complete your profile first.");

    const internship = await Internship.create({
      ...req.body,
      company: company._id,
      postedBy: req.user._id,
    });

    await Company.findByIdAndUpdate(company._id, { $inc: { totalInternshipsPosted: 1 } });

    return sendSuccess(res, 201, "Internship posted successfully", internship);
  } catch (error) { next(error); }
};

/**
 * @route   GET /api/internships
 * @desc    Get all active internships with filters
 * @access  Public
 */
const getAllInternships = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const { search, location, skill, isPaid, isRemote, experience, sort } = req.query;

    const filter = { status: "active" };
    if (search) filter.$text = { $search: search };
    if (location) filter.location = new RegExp(location, "i");
    if (skill) filter.requiredSkills = { $in: [new RegExp(skill, "i")] };
    if (isPaid === "true") filter.isPaid = true;
    if (isRemote === "true") filter.isRemote = true;
    if (experience) filter.experienceRequired = experience;

    const sortOption = getSortOption(sort, ALLOWED_SORT, "-createdAt");

    const [internships, total] = await Promise.all([
      Internship.find(filter)
        .populate("company", "companyName logo industry headquarters")
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Internship.countDocuments(filter),
    ]);

    return sendPaginated(res, internships, page, limit, total);
  } catch (error) { next(error); }
};

/**
 * @route   GET /api/internships/:id
 * @desc    Get single internship details
 * @access  Public
 */
const getInternshipById = async (req, res, next) => {
  try {
    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("company", "companyName logo industry website headquarters description");

    if (!internship) return sendError(res, 404, "Internship not found");
    return sendSuccess(res, 200, "Internship fetched", internship);
  } catch (error) { next(error); }
};

/**
 * @route   PUT /api/internships/:id
 * @desc    Update internship
 * @access  Private (company owner)
 */
const updateInternship = async (req, res, next) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    const internship = await Internship.findOne({ _id: req.params.id, company: company._id });
    if (!internship) return sendError(res, 404, "Internship not found or unauthorized");

    Object.assign(internship, req.body);
    await internship.save();

    return sendSuccess(res, 200, "Internship updated", internship);
  } catch (error) { next(error); }
};

/**
 * @route   DELETE /api/internships/:id
 * @desc    Delete internship
 * @access  Private (company owner or admin)
 */
const deleteInternship = async (req, res, next) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    const query = req.user.role === "admin"
      ? { _id: req.params.id }
      : { _id: req.params.id, company: company?._id };

    const internship = await Internship.findOneAndDelete(query);
    if (!internship) return sendError(res, 404, "Internship not found or unauthorized");

    return sendSuccess(res, 200, "Internship deleted");
  } catch (error) { next(error); }
};

/**
 * @route   GET /api/internships/company/my-internships
 * @desc    Get all internships posted by logged-in company
 * @access  Private (company)
 */
const getMyInternships = async (req, res, next) => {
  try {
    const company = await Company.findOne({ user: req.user._id });
    if (!company) return sendError(res, 404, "Company profile not found");

    const { page, limit, skip } = getPaginationOptions(req.query);
    const filter = { company: company._id };
    if (req.query.status) filter.status = req.query.status;

    const [internships, total] = await Promise.all([
      Internship.find(filter).sort("-createdAt").skip(skip).limit(limit),
      Internship.countDocuments(filter),
    ]);

    return sendPaginated(res, internships, page, limit, total);
  } catch (error) { next(error); }
};

module.exports = { createInternship, getAllInternships, getInternshipById, updateInternship, deleteInternship, getMyInternships };
