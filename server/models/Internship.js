/**
 * models/Internship.js — Internship Posting Model
 */
const mongoose = require("mongoose");

const InternshipSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Internship title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    requiredSkills: {
      type: [String],
      required: [true, "Required skills are needed"],
      validate: [(v) => v.length > 0, "At least one skill required"],
    },
    preferredSkills: [{ type: String }],
    location: { type: String, required: true },
    isRemote: { type: Boolean, default: false },
    duration: { type: String, required: true }, // e.g., "2 months", "6 months"
    stipend: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    openings: { type: Number, default: 1, min: 1 },
    applicationDeadline: { type: Date },
    startDate: { type: Date },
    experienceRequired: {
      type: String,
      enum: ["fresher", "0-1 years", "1-2 years", "2+ years"],
      default: "fresher",
    },
    educationRequired: { type: String }, // e.g., "B.Tech", "Any Graduate"
    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },
    perks: [{ type: String }],
    responsibilities: [{ type: String }],
    applicationCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    diversityFriendly: { type: Boolean, default: false },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

InternshipSchema.index({ company: 1, status: 1 });
InternshipSchema.index({ requiredSkills: 1 });
InternshipSchema.index({ location: 1 });
InternshipSchema.index({ status: 1, createdAt: -1 });
InternshipSchema.index({ title: "text", description: "text", requiredSkills: "text" });

module.exports = mongoose.model("Internship", InternshipSchema);
