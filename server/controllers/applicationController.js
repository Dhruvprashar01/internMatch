/**
 * controllers/applicationController.js
 * ADDED:
 *  - timeline push on every status change
 *  - markCompleted — company marks internship done → generates certificate
 *  - verifyCertificate — public route to verify a cert by ID
 */
"use strict";

const Application = require("../models/Application");
const Candidate   = require("../models/Candidate");
const Internship  = require("../models/Internship");
const Company     = require("../models/Company");
const ResumeData  = require("../models/ResumeData");
const { sendSuccess, sendError, sendPaginated } = require("../utils/responseHandler");
const { getPaginationOptions }                  = require("../utils/helpers");
const { calculateMatchScore }                   = require("../services/matchingEngine");
const { generateMatchExplanation }              = require("../services/geminiService");
const { calculateAtsScore, generateAtsAnalysis } = require("../services/atsService");
const { generateCertId, buildCertificateHTML }  = require("../services/certificateService");
const mongoose = require("mongoose");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Timeline message map
const TIMELINE_MSG = {
  pending:     "Application submitted successfully",
  reviewed:    "Your application has been reviewed by the company",
  shortlisted: "🎉 Congratulations! You have been shortlisted",
  accepted:    "🎊 You have been accepted for this internship!",
  rejected:    "Application was not selected this time",
  withdrawn:   "You withdrew this application",
  completed:   "🏆 Internship completed! Certificate issued.",
};

const applyToInternship = async (req, res, next) => {
  try {
    if (!isValidId(req.params.internshipId))
      return sendError(res, 400, "Invalid internship ID");

    const candidate = await Candidate.findOne({ user: req.user._id });
    if (!candidate) return sendError(res, 404, "Candidate profile not found");

    const internship = await Internship.findById(req.params.internshipId).populate("company");
    if (!internship)                    return sendError(res, 404, "Internship not found");
    if (internship.status !== "active") return sendError(res, 400, "This internship is no longer accepting applications");

    const existing = await Application.findOne({ candidate: candidate._id, internship: internship._id });
    if (existing) return sendError(res, 409, "You have already applied to this internship");

    const candidatePlain  = candidate.toObject();
    const internshipPlain = internship.toObject();

    const matchResult  = calculateMatchScore(candidatePlain, internshipPlain);
    const numericScore = Number.isFinite(matchResult?.score) ? Math.round(matchResult.score) : 0;

    const resumeData = await ResumeData.findOne({ candidate: candidate._id }).lean();
    const atsQuick   = calculateAtsScore(resumeData, internshipPlain);
    let atsAi = null;
    try { atsAi = await generateAtsAnalysis(resumeData, internshipPlain, atsQuick.overall); } catch {}

    let aiExplanation = null;
    try { aiExplanation = await generateMatchExplanation(candidatePlain, internshipPlain, numericScore); } catch {}

    const application = await Application.create({
      candidate:   candidate._id,
      internship:  internship._id,
      company:     internship.company._id,
      coverLetter: (req.body.coverLetter || "").slice(0, 2000),
      matchScore:  numericScore,
      aiExplanation,
      atsScore:    { overall: atsQuick.overall, grade: atsQuick.grade, breakdown: atsQuick.breakdown, aiAnalysis: atsAi },
      timeline:    [{ status: "pending", message: TIMELINE_MSG.pending }],
    });

    await Promise.all([
      Internship.findByIdAndUpdate(internship._id, { $inc: { applicationCount: 1 } }),
      Candidate.findByIdAndUpdate(candidate._id,   { $addToSet: { appliedInternships: internship._id } }),
    ]);

    return sendSuccess(res, 201, "Application submitted successfully", application);
  } catch (error) { next(error); }
};

const getMyApplications = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user._id });
    if (!candidate) return sendError(res, 404, "Candidate profile not found");

    const { page, limit, skip } = getPaginationOptions(req.query);
    const filter = { candidate: candidate._id };
    const VALID  = ["pending","reviewed","shortlisted","accepted","rejected","withdrawn","completed"];
    if (req.query.status && VALID.includes(req.query.status)) filter.status = req.query.status;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate({ path: "internship", select: "title location stipend duration status", populate: { path: "company", select: "companyName logo isVerified" } })
        .sort("-createdAt").skip(skip).limit(limit).lean(),
      Application.countDocuments(filter),
    ]);
    return sendPaginated(res, applications, page, limit, total);
  } catch (error) { next(error); }
};

const getInternshipApplicants = async (req, res, next) => {
  try {
    if (!isValidId(req.params.internshipId))
      return sendError(res, 400, "Invalid internship ID");

    const company = await Company.findOne({ user: req.user._id });
    if (!company) return sendError(res, 403, "Company profile not found");

    const internship = await Internship.findOne({ _id: req.params.internshipId, company: company._id });
    if (!internship) return sendError(res, 404, "Internship not found or unauthorized");

    const { page, limit, skip } = getPaginationOptions(req.query);
    const [applications, total] = await Promise.all([
      Application.find({ internship: internship._id })
        .populate({ path: "candidate", populate: { path: "user", select: "name email" } })
        .sort("-atsScore.overall -matchScore -createdAt")
        .skip(skip).limit(limit).lean(),
      Application.countDocuments({ internship: internship._id }),
    ]);
    return sendPaginated(res, applications, page, limit, total);
  } catch (error) { next(error); }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return sendError(res, 400, "Invalid application ID");

    const { status, companyNotes } = req.body;
    const VALID = ["reviewed","shortlisted","accepted","rejected"];
    if (!VALID.includes(status)) return sendError(res, 400, `Status must be one of: ${VALID.join(", ")}`);

    const company = await Company.findOne({ user: req.user._id });
    if (!company) return sendError(res, 403, "Company profile not found");

    const application = await Application.findOne({ _id: req.params.id, company: company._id });
    if (!application) return sendError(res, 404, "Application not found or unauthorized");

    // Prevent changing once a final decision has been made
    const LOCKED = ["accepted","rejected","completed","withdrawn"];
    if (LOCKED.includes(application.status)) {
      return sendError(res, 400, `Cannot change status — application is already ${application.status}`);
    }

    application.status     = status;
    application.reviewedAt = new Date();
    if (companyNotes) application.companyNotes = String(companyNotes).slice(0, 1000);
    if (["accepted","rejected"].includes(status)) application.decidedAt = new Date();

    // ── Push to timeline ───────────────────────────────────────────────────
    application.timeline.push({
      status,
      message: TIMELINE_MSG[status] || `Status updated to ${status}`,
    });

    await application.save();
    return sendSuccess(res, 200, `Application ${status}`, application);
  } catch (error) { next(error); }
};

const withdrawApplication = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return sendError(res, 400, "Invalid application ID");

    const candidate = await Candidate.findOne({ user: req.user._id });
    if (!candidate) return sendError(res, 404, "Candidate profile not found");

    const application = await Application.findOne({ _id: req.params.id, candidate: candidate._id });
    if (!application) return sendError(res, 404, "Application not found");
    if (["accepted","rejected"].includes(application.status)) return sendError(res, 400, "Cannot withdraw a decided application");
    if (application.status === "withdrawn") return sendError(res, 400, "Already withdrawn");

    application.status = "withdrawn";
    application.timeline.push({ status: "withdrawn", message: TIMELINE_MSG.withdrawn });
    await application.save();

    await Candidate.findByIdAndUpdate(candidate._id, { $pull: { appliedInternships: application.internship } });

    return sendSuccess(res, 200, "Application withdrawn successfully");
  } catch (error) { next(error); }
};

/**
 * PATCH /api/applications/:id/complete
 * Company marks internship as completed → auto-generate certificate
 */
const markCompleted = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return sendError(res, 400, "Invalid application ID");

    const company = await Company.findOne({ user: req.user._id });
    if (!company) return sendError(res, 403, "Company profile not found");

    const application = await Application.findOne({ _id: req.params.id, company: company._id })
      .populate({ path: "candidate", populate: { path: "user", select: "name email" } })
      .populate("internship");

    if (!application) return sendError(res, 404, "Application not found or unauthorized");
    if (application.status !== "accepted") return sendError(res, 400, "Only accepted applications can be marked complete");

    const certId       = generateCertId();
    const issuedAt     = new Date();
    const verifyUrl    = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify/${certId}`;
    const candidateName= application.candidate?.user?.name || "Candidate";
    const skills       = application.candidate?.skills || [];

    const certData = {
      certificateId:   certId,
      issuedAt,
      candidateName,
      internshipTitle: application.internship?.title,
      companyName:     company.companyName,
      duration:        application.internship?.duration,
      skills,
      verifyUrl,
    };

    application.status      = "completed";
    application.completedAt = issuedAt;
    application.certificate = certData;
    application.timeline.push({ status: "completed", message: TIMELINE_MSG.completed });
    await application.save();

    return sendSuccess(res, 200, "Internship marked complete & certificate issued", {
      certificateId: certId,
      verifyUrl,
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/applications/certificate/:applicationId
 * Returns the HTML certificate for download/print
 */
const getCertificate = async (req, res, next) => {
  try {
    if (!isValidId(req.params.applicationId)) return sendError(res, 400, "Invalid ID");

    const application = await Application.findById(req.params.applicationId)
      .populate({ path: "candidate", populate: { path: "user", select: "name" } });

    if (!application) return sendError(res, 404, "Application not found");

    // Only the candidate themselves can download
    const candidateUserId = application.candidate?.user?._id?.toString();
    if (candidateUserId !== req.user._id.toString()) return sendError(res, 403, "Not authorized");

    if (!application.certificate?.certificateId) return sendError(res, 404, "No certificate issued yet");

    const html = buildCertificateHTML(application.certificate);
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `inline; filename="certificate-${application.certificate.certificateId}.html"`);
    return res.send(html);
  } catch (error) { next(error); }
};

/**
 * GET /api/applications/verify/:certId   (public)
 * Anyone can verify a certificate by its ID
 */
const verifyCertificate = async (req, res, next) => {
  try {
    const application = await Application.findOne({
      "certificate.certificateId": req.params.certId,
    }).lean();

    if (!application || !application.certificate) {
      return sendError(res, 404, "Certificate not found. It may be invalid or revoked.");
    }

    return sendSuccess(res, 200, "Certificate is valid ✓", {
      valid:           true,
      certificateId:   application.certificate.certificateId,
      candidateName:   application.certificate.candidateName,
      internshipTitle: application.certificate.internshipTitle,
      companyName:     application.certificate.companyName,
      duration:        application.certificate.duration,
      issuedAt:        application.certificate.issuedAt,
      skills:          application.certificate.skills,
    });
  } catch (error) { next(error); }
};

module.exports = {
  applyToInternship, getMyApplications, getInternshipApplicants,
  updateApplicationStatus, withdrawApplication,
  markCompleted, getCertificate, verifyCertificate,
};