/**
 * models/User.js
 * ADDED: googleId, authProvider fields for Google OAuth
 * password is now optional (Google users have no password)
 */
"use strict";

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String, required: [true, "Name is required"],
      trim: true, minlength: 2, maxlength: 100,
    },
    email: {
      type: String, required: [true, "Email is required"],
      unique: true, lowercase: true, trim: true,
      match: [/^[\w.-]+@[\w.-]+\.\w{2,}$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
      // Not required — Google users have no password
    },
    role: {
      type: String,
      enum: ["candidate", "company", "admin"],
      required: true,
    },
    // ── Google OAuth fields ─────────────────────────────────────────────────
    googleId: {
      type: String,
      default: null,
      sparse: true, // allows multiple null values in unique index
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    avatar: {
      type: String,
      default: null, // Google provides a profile picture URL
    },
    // ───────────────────────────────────────────────────────────────────────
    isActive:         { type: Boolean, default: true },
    lastLogin:        { type: Date },
    profileCompleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before save — skip if no password (Google users)
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Google users have no password
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

UserSchema.index({ role: 1 });
UserSchema.index({ googleId: 1 }, { sparse: true });

module.exports = mongoose.model("User", UserSchema);