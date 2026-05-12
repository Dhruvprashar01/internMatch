/**
 * models/Application.js
 * ADDED:
 *  - timeline[] — tracks every status change with timestamp + message
 *  - certificate — stores generated certificate data
 *  - completedAt — when internship was marked complete
 */
"use strict";
const mongoose = require("mongoose");

const TimelineEventSchema = new mongoose.Schema({
  status:    { type: String, required: true },
  message:   { type: String },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const CertificateSchema = new mongoose.Schema({
  certificateId:  { type: String }, // unique ID e.g. IM-2024-XXXXX
  issuedAt:       { type: Date },
  candidateName:  { type: String },
  internshipTitle:{ type: String },
  companyName:    { type: String },
  duration:       { type: String },
  skills:         [{ type: String }],
  verifyUrl:      { type: String },
}, { _id: false });

const ApplicationSchema = new mongoose.Schema(
  {
    candidate:    { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
    internship:   { type: mongoose.Schema.Types.ObjectId, ref: "Internship", required: true },
    company:      { type: mongoose.Schema.Types.ObjectId, ref: "Company",    required: true },
    coverLetter:  { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending","reviewed","shortlisted","accepted","rejected","withdrawn","completed"],
      default: "pending",
    },
    matchScore:    { type: Number, default: 0, min: 0, max: 100 },
    aiExplanation: { type: String, default: null },
    companyNotes:  { type: String, select: false },
    reviewedAt:    { type: Date },
    decidedAt:     { type: Date },
    completedAt:   { type: Date },

    // ── Status Timeline ────────────────────────────────────────────────────
    timeline: {
      type: [TimelineEventSchema],
      default: [{ status: "pending", message: "Application submitted successfully" }],
    },

    // ── Certificate ────────────────────────────────────────────────────────
    certificate: { type: CertificateSchema, default: null },

    // ── ATS Score ──────────────────────────────────────────────────────────
    atsScore: {
      overall:  { type: Number, default: null },
      grade:    { type: String },
      breakdown: {
        skills:     { score: Number, matched: [String], missing: [String] },
        keywords:   { score: Number, found: [String], total: Number },
        education:  { score: Number, detail: String },
        experience: { score: Number, detail: String },
      },
      aiAnalysis: {
        summary:      { type: String },
        strengths:    [{ type: String }],
        improvements: [{ type: String }],
        keywordTip:   { type: String },
      },
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

ApplicationSchema.index({ candidate: 1, internship: 1 }, { unique: true });
ApplicationSchema.index({ internship: 1, status: 1 });
ApplicationSchema.index({ candidate: 1, status: 1 });
ApplicationSchema.index({ company: 1, status: 1 });
ApplicationSchema.index({ "certificate.certificateId": 1 }, { sparse: true });

module.exports = mongoose.model("Application", ApplicationSchema);