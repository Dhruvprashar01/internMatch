/**
 * models/Company.js
 * ADDED: verificationStatus, verificationRequestedAt, verificationNote
 */
"use strict";
const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    user:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName:  { type: String, required: [true, "Company name is required"], trim: true },
    description:  { type: String, maxlength: 2000 },
    industry:     { type: String },
    website:      { type: String },
    logo:         { type: String, default: null },
    headquarters: { type: String },
    size:         { type: String, enum: ["1-10","11-50","51-200","201-500","501-1000","1000+"] },
    founded:      { type: Number },
    linkedIn:     { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    totalInternshipsPosted: { type: Number, default: 0 },

    // ── Verification ───────────────────────────────────────────────────────
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected"],
      default: "none",
    },
    verificationRequestedAt: { type: Date, default: null },
    verificationNote:        { type: String, default: null }, // admin note on reject
    verifiedAt:              { type: Date, default: null },
    verifiedBy:              { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Supporting documents provided by company
    verificationDocs: {
      gstNumber:     { type: String, default: null },
      linkedInUrl:   { type: String, default: null },
      websiteUrl:    { type: String, default: null },
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

CompanySchema.virtual("internships", {
  ref: "Internship", localField: "_id", foreignField: "company",
});

CompanySchema.index({ companyName: "text", industry: "text" });

module.exports = mongoose.model("Company", CompanySchema);