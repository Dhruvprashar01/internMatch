/**
 * utils/constants.js — App-wide constants
 */

const ROLES = {
  CANDIDATE: "candidate",
  COMPANY: "company",
  ADMIN: "admin",
};

const APPLICATION_STATUS = {
  PENDING: "pending",
  REVIEWED: "reviewed",
  SHORTLISTED: "shortlisted",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
};

const INTERNSHIP_STATUS = {
  ACTIVE: "active",
  CLOSED: "closed",
  DRAFT: "draft",
};

const DIVERSITY_CATEGORIES = {
  GENERAL: "General",
  SC: "SC",
  ST: "ST",
  OBC: "OBC",
  PWD: "PWD",
  EWS: "EWS",
};

const EXPERIENCE_LEVELS = {
  FRESHER: "fresher",
  ZERO_TO_ONE: "0-1 years",
  ONE_TO_TWO: "1-2 years",
  TWO_PLUS: "2+ years",
};

// Matching engine weights (must sum to 1.0)
const MATCH_WEIGHTS = {
  SKILL_MATCH: 0.40,
  EDUCATION: 0.20,
  EXPERIENCE: 0.20,
  LOCATION: 0.15,
  AVAILABILITY: 0.05,
};

// Fairness re-ranking boost (0–1 scale added to score)
const FAIRNESS_BOOST = {
  SC: 0.05,
  ST: 0.07,
  OBC: 0.03,
  PWD: 0.08,
  EWS: 0.04,
  General: 0,
};

module.exports = {
  ROLES,
  APPLICATION_STATUS,
  INTERNSHIP_STATUS,
  DIVERSITY_CATEGORIES,
  EXPERIENCE_LEVELS,
  MATCH_WEIGHTS,
  FAIRNESS_BOOST,
};
