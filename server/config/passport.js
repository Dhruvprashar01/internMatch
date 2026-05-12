/**
 * config/passport.js — Passport Google OAuth Strategy
 *
 * Flow:
 *  1. User clicks "Sign in with Google"
 *  2. Google redirects to /api/auth/google/callback with a profile
 *  3. We check if user exists by googleId or email
 *  4. If email exists (local account) → link googleId to it
 *  5. If new user → create account with role=candidate
 *  6. Return user to JWT generation
 */
"use strict";

const passport  = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User      = require("../models/User");
const Candidate = require("../models/Candidate");
const { logger }= require("../middleware/logger");

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId    = profile.id;
        const email       = profile.emails?.[0]?.value?.toLowerCase();
        const name        = profile.displayName || "Google User";
        const avatar      = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error("No email returned from Google"), null);
        }

        // ── Case 1: Already linked with this Google ID ─────────────────────
        let user = await User.findOne({ googleId });
        if (user) {
          // Update avatar if changed
          if (avatar && user.avatar !== avatar) {
            user.avatar = avatar;
            await user.save({ validateBeforeSave: false });
          }
          return done(null, user);
        }

        // ── Case 2: Existing local account with same email → link it ───────
        user = await User.findOne({ email });
        if (user) {
          user.googleId     = googleId;
          user.authProvider = "google";
          if (avatar && !user.avatar) user.avatar = avatar;
          await user.save({ validateBeforeSave: false });
          logger.info(`Google linked to existing account: ${email}`);
          return done(null, user);
        }

        // ── Case 3: Brand new user — create candidate account ──────────────
        user = await User.create({
          name,
          email,
          googleId,
          authProvider: "google",
          role:   "candidate",
          avatar,
          isActive:         true,
          profileCompleted: false,
        });

        // Auto-create candidate profile
        await Candidate.create({ user: user._id });

        logger.info(`New Google user registered: ${email}`);
        return done(null, user);

      } catch (err) {
        logger.error("Google OAuth error: " + err.message);
        return done(err, null);
      }
    }
  )
);

// Minimal serialize/deserialize (we use JWT, not sessions)
passport.serializeUser((user, done)   => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (e) { done(e, null); }
});

module.exports = passport;