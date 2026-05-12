/**
 * models/Candidate.js — Candidate Profile Model
 */
const mongoose = require("mongoose");

const EducationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: { type: String },
  startYear: { type: Number },
  endYear: { type: Number },
  grade: { type: String },
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  duration: { type: String },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  technologies: [{ type: String }],
  link: { type: String },
}, { _id: false });

const CandidateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    phone: { type: String },
    bio: { type: String, maxlength: 500 },
    skills: [{ type: String, trim: true }],
    locationPreferences: [{ type: String }],
    currentLocation: { type: String },
    education: [EducationSchema],
    experience: [ExperienceSchema],
    projects: [ProjectSchema],
    resumeUrl: { type: String, default: null },
    resumeOriginalName: { type: String, default: null },
    resumeParsedAt: { type: Date, default: null },
    experienceLevel: {
      type: String,
      enum: ["fresher", "0-1 years", "1-2 years", "2+ years"],
      default: "fresher",
    },
    availability: {
      type: String,
      enum: ["immediate", "1 month", "2 months", "3 months"],
      default: "immediate",
    },
    diversityCategory: {
      type: String,
      enum: ["General", "SC", "ST", "OBC", "PWD", "EWS"],
      default: "General",
    },
    linkedIn: { type: String },
    github: { type: String },
    portfolio: { type: String },
    appliedInternships: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
    }],
    savedInternships: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: profile completion percentage
CandidateSchema.virtual("profileCompletion").get(function () {
  let score = 0;
  if (this.phone) score += 10;
  if (this.bio) score += 10;
  if (this.skills && this.skills.length > 0) score += 20;
  if (this.education && this.education.length > 0) score += 20;
  if (this.resumeUrl) score += 25;
  if (this.locationPreferences && this.locationPreferences.length > 0) score += 15;
  return score;
});


CandidateSchema.index({ skills: 1 });
CandidateSchema.index({ diversityCategory: 1 });
CandidateSchema.index({ experienceLevel: 1 });

module.exports = mongoose.model("Candidate", CandidateSchema);