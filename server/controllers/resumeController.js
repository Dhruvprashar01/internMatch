/**
 * controllers/resumeController.js
 * ADDED: ATS scoring after resume upload
 */
"use strict";

const Candidate  = require("../models/Candidate");
const ResumeData = require("../models/ResumeData");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { parseResume }            = require("../services/resumeParser");
const { enhanceSkillsWithAI }    = require("../services/geminiService");
const { calculateAtsScore, generateAtsAnalysis } = require("../services/atsService");
const { logger }                 = require("../middleware/logger");
const fs   = require("fs");
const path = require("path");

const safeDeleteFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") logger.warn(`Could not delete ${filePath}: ${err.message}`);
  });
};

/**
 * @route   POST /api/resume/upload
 * @access  Private (candidate)
 */
const uploadResume = async (req, res, next) => {
  const uploadedFilePath = req.file?.path;
  try {
    if (!req.file) return sendError(res, 400, "No file uploaded");

    const candidate = await Candidate.findOne({ user: req.user._id });
    if (!candidate) { safeDeleteFile(uploadedFilePath); return sendError(res, 404, "Candidate profile not found"); }

    logger.info(`Parsing resume for candidate: ${candidate._id}`);
    const parsed = await parseResume(req.file.path, req.file.mimetype);

    // Enhance skills with AI
    let aiSkills = [];
    try { aiSkills = await enhanceSkillsWithAI(parsed.rawText, parsed.skills); }
    catch { logger.warn("Gemini skill enhancement failed"); }

    const allSkills = [...new Set([...parsed.skills, ...aiSkills])].slice(0, 60);

    // ── Calculate general ATS score (no specific job) ──────────────────────
    const mockInternship = { requiredSkills: [], preferredSkills: [], title: "", description: "", educationRequired: "Any", experienceRequired: "fresher" };
    const quickAts = calculateAtsScore({ parsedSkills: parsed.skills, aiEnhancedSkills: aiSkills, parsedEducation: parsed.education, parsedExperience: parsed.experience, rawText: parsed.rawText }, mockInternship);

    // AI analysis of resume quality (general)
    let aiAnalysis = null;
    try {
      aiAnalysis = await generateAtsAnalysis(
        { parsedSkills: parsed.skills, aiEnhancedSkills: aiSkills, parsedEducation: parsed.education, parsedExperience: parsed.experience },
        { title: "General Resume Review", requiredSkills: [], experienceRequired: "fresher", educationRequired: "Any" },
        quickAts.overall
      );
    } catch { logger.warn("ATS AI analysis failed"); }

    // Delete old resume file
    if (candidate.resumeUrl) {
      const oldPath = path.join(__dirname, "../uploads", path.basename(candidate.resumeUrl));
      safeDeleteFile(oldPath);
    }

    // Save resume data with ATS score
    await ResumeData.findOneAndUpdate(
      { candidate: candidate._id },
      {
        rawText:           parsed.rawText?.slice(0, 50000),
        parsedName:        parsed.name,
        parsedEmail:       parsed.email,
        parsedPhone:       parsed.phone,
        parsedSkills:      parsed.skills,
        parsedEducation:   parsed.education,
        parsedExperience:  parsed.experience,
        parsedProjects:    parsed.projects,
        aiEnhancedSkills:  aiSkills,
        parsingMethod:     parsed.method,
        parsingConfidence: parsed.confidence,
        fileType:          req.file.mimetype,
        filePath:          req.file.path,
        fileSize:          req.file.size,
        parsedAt:          new Date(),
        atsScore: {
          overall:      quickAts.overall,
          grade:        quickAts.grade,
          breakdown:    quickAts.breakdown,
          aiAnalysis,
          calculatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Update candidate profile
    const updates = {
      resumeUrl:          `/uploads/${req.file.filename}`,
      resumeOriginalName: req.file.originalname,
      resumeParsedAt:     new Date(),
    };
    if (allSkills.length)           updates.skills     = allSkills;
    if (parsed.education?.length)   updates.education  = parsed.education;
    if (parsed.experience?.length)  updates.experience = parsed.experience;
    if (parsed.projects?.length)    updates.projects   = parsed.projects;

    await Candidate.findByIdAndUpdate(candidate._id, { $set: updates });

    return sendSuccess(res, 200, "Resume uploaded and parsed successfully", {
      autoFilled: {
        skills:          allSkills,
        educationCount:  parsed.education?.length || 0,
        experienceCount: parsed.experience?.length || 0,
        projectsCount:   parsed.projects?.length || 0,
      },
      atsScore: {
        overall:    quickAts.overall,
        grade:      quickAts.grade,
        breakdown:  quickAts.breakdown,
        aiAnalysis,
      },
    });
  } catch (error) {
    safeDeleteFile(uploadedFilePath);
    next(error);
  }
};

/**
 * @route   GET /api/resume/my-data
 * @access  Private (candidate)
 */
const getMyResumeData = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user._id });
    if (!candidate) return sendError(res, 404, "Profile not found");
    const data = await ResumeData.findOne({ candidate: candidate._id }).lean();
    if (!data) return sendError(res, 404, "No resume data found. Please upload a resume.");
    return sendSuccess(res, 200, "Resume data fetched", data);
  } catch (error) { next(error); }
};

module.exports = { uploadResume, getMyResumeData };