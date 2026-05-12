/**
 * utils/helpers.js — General utility functions
 */

/**
 * Normalize skill strings for comparison (lowercase, trim)
 */
const normalizeSkill = (skill) => skill.toLowerCase().trim().replace(/[^a-z0-9#+.]/g, "");

/**
 * Calculate Jaccard similarity between two skill arrays
 */
const jaccardSimilarity = (setA, setB) => {
  const a = new Set(setA.map(normalizeSkill));
  const b = new Set(setB.map(normalizeSkill));
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
};

/**
 * Check if two location strings are compatible
 */
const locationMatch = (candidateLocations, internshipLocation) => {
  if (!internshipLocation || internshipLocation.toLowerCase() === "remote") return 1;
  if (!candidateLocations || candidateLocations.length === 0) return 0.3;

  const intern = internshipLocation.toLowerCase();
  const match = candidateLocations.some((loc) => {
    const l = loc.toLowerCase();
    return l.includes(intern) || intern.includes(l) || l === "anywhere" || l === "remote";
  });
  return match ? 1 : 0.2;
};

/**
 * Map experience level string to numeric value
 */
const experienceToNumber = (level) => {
  const map = { fresher: 0, "0-1 years": 0.5, "1-2 years": 1.5, "2+ years": 3 };
  return map[level] || 0;
};

/**
 * Generate pagination options from query params
 */
const getPaginationOptions = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 10, 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Sanitize MongoDB sort field to prevent injection
 */
const getSortOption = (sortBy, allowedFields, defaultSort = "-createdAt") => {
  if (!sortBy) return defaultSort;
  const field = sortBy.startsWith("-") ? sortBy.slice(1) : sortBy;
  return allowedFields.includes(field) ? sortBy : defaultSort;
};

module.exports = {
  normalizeSkill,
  jaccardSimilarity,
  locationMatch,
  experienceToNumber,
  getPaginationOptions,
  getSortOption,
};
