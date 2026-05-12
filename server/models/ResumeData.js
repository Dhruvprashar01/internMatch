/**
 * models/ResumeData.js — Parsed Resume Data Model
 * ADDED: atsScore field to store ATS results after resume upload
 */
const mongoose = require("mongoose");

const AtsBreakdownSchema = new mongoose.Schema({
  score:   { type: Number, default: 0 },
  weight:  { type: String },
  matched: [{ type: String }],
  missing: [{ type: String }],
  found:   [{ type: String }],
  total:   { type: Number },
  detail:  { type: String },
}, { _id: false });

const ResumeDataSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      unique: true,
    },
    rawText:          { type: String },
    parsedName:       { type: String },
    parsedEmail:      { type: String },
    parsedPhone:      { type: String },
    parsedSkills:     [{ type: String }],
    parsedEducation: [{
      institution: String, degree: String, field: String, year: String, _id: false,
    }],
    parsedExperience: [{
      company: String, role: String, duration: String, description: String, _id: false,
    }],
    parsedProjects: [{
      title: String, description: String, technologies: [String], _id: false,
    }],
    aiEnhancedSkills:   [{ type: String }],
    parsingMethod:      { type: String, enum: ["pdf-parse", "mammoth", "manual", "docx-parser"] },
    parsingConfidence:  { type: Number, min: 0, max: 1, default: 0 },
    parsingErrors:      [{ type: String }],
    fileType:  { type: String },
    filePath:  { type: String },
    fileSize:  { type: Number },
    parsedAt:  { type: Date, default: Date.now },

    // ── ATS Score (general — not job-specific) ─────────────────────────────
    atsScore: {
      overall:  { type: Number, default: null },
      grade:    { type: String },
      breakdown: {
        skills:     AtsBreakdownSchema,
        keywords:   AtsBreakdownSchema,
        education:  AtsBreakdownSchema,
        experience: AtsBreakdownSchema,
      },
      aiAnalysis: {
        summary:      { type: String },
        strengths:    [{ type: String }],
        improvements: [{ type: String }],
        keywordTip:   { type: String },
      },
      calculatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeData", ResumeDataSchema);