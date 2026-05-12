/**
 * services/matchingEngine.js
 * ═══════════════════════════════════════════════════════════════════════════
 * AI-Based Smart Allocation Engine — Core Matching Algorithm
 *
 * ARCHITECTURE
 * ─────────────
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │  Candidate Profile  ──►  Feature Extractor                         │
 *  │  Internship Posting ──►  Feature Extractor                         │
 *  │                                          │                         │
 *  │                          ┌───────────────▼──────────────────┐      │
 *  │                          │        Scoring Engine             │      │
 *  │                          │  ┌──────────────────────────────┐│      │
 *  │                          │  │ Skill Score     (TF-IDF+JAC) ││      │
 *  │                          │  │ Education Score (rule-based)  ││      │
 *  │                          │  │ Experience Score(gap-penalty) ││      │
 *  │                          │  │ Location Score  (tier-match)  ││      │
 *  │                          │  │ Availability    (urgency)     ││      │
 *  │                          │  │ Profile Score   (completeness)││      │
 *  │                          │  └──────────────────────────────┘│      │
 *  │                          │     Weighted Sum → 0–100          │      │
 *  │                          └───────────────────────────────────┘      │
 *  │                                          │                         │
 *  │                          ┌───────────────▼──────────────────┐      │
 *  │                          │    Fairness Re-ranker             │      │
 *  │                          │  Diversity boost + quota guard    │      │
 *  │                          └───────────────────────────────────┘      │
 *  │                                          │                         │
 *  │                                  Top-N Results                     │
 *  └─────────────────────────────────────────────────────────────────────┘
 *
 * SCORING WEIGHTS (must sum to 1.0)
 * ────────────────────────────────────
 *   Skill Match      40%  (most predictive signal)
 *   Education        20%  (degree + field relevance)
 *   Experience       20%  (level gap penalty)
 *   Location         15%  (preference alignment)
 *   Availability      3%  (join urgency)
 *   Profile Quality   2%  (completeness bonus)
 *
 * SKILL SCORING METHOD
 * ────────────────────────────────────
 *   Jaccard similarity on required skills  (weight 0.60)
 *   Jaccard similarity on preferred skills (weight 0.25)
 *   Semantic skill cluster bonus            (weight 0.15)
 *     → Python ↔ ML/DS cluster, React ↔ Node cluster, etc.
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Constants & Configuration
// ─────────────────────────────────────────────────────────────────────────────

/** Scoring dimension weights — MUST sum to 1.0 */
const WEIGHTS = {
  SKILL:        0.40,
  EDUCATION:    0.20,
  EXPERIENCE:   0.20,
  LOCATION:     0.15,
  AVAILABILITY: 0.03,
  PROFILE:      0.02,
};

/** Minimum score threshold for a result to appear in recommendations */
const MIN_SCORE_THRESHOLD = 5;

/** Soft skill clusters: matching one skill boosts related skills */
const SKILL_CLUSTERS = {
  python_data: ["python", "pandas", "numpy", "matplotlib", "scipy", "jupyter", "anaconda"],
  python_ml:   ["python", "machine learning", "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "deep learning", "nlp"],
  javascript:  ["javascript", "typescript", "node.js", "react", "angular", "vue", "next.js", "express"],
  java:        ["java", "spring", "spring boot", "hibernate", "maven", "gradle"],
  devops:      ["docker", "kubernetes", "jenkins", "ci/cd", "ansible", "terraform", "github actions"],
  cloud:       ["aws", "azure", "gcp", "google cloud", "ec2", "s3", "lambda", "cloud functions"],
  database:    ["sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra"],
  mobile:      ["android", "ios", "react native", "flutter", "swift", "kotlin"],
  data_eng:    ["apache spark", "hadoop", "kafka", "airflow", "etl", "data pipeline", "dbt"],
  security:    ["cybersecurity", "owasp", "penetration testing", "ethical hacking", "network security"],
};

/**
 * Map of degree keywords → numeric tier (higher = more relevant for tech roles)
 * Used for education scoring
 */
const DEGREE_TIERS = {
  "ph.d":            5,
  "phd":             5,
  "m.tech":          4,
  "m.e":             4,
  "master":          4,
  "msc":             4,
  "m.sc":            4,
  "mba":             3,
  "b.tech":          3,
  "b.e":             3,
  "bachelor":        3,
  "bsc":             3,
  "b.sc":            3,
  "bca":             2,
  "mca":             4,
  "diploma":         2,
  "12th":            1,
  "hsc":             1,
  "12":              1,
  "10th":            0,
  "ssc":             0,
};

/**
 * Experience level → numeric months (for gap scoring)
 */
const EXP_MONTHS = {
  "fresher":    0,
  "0-1 years":  6,
  "1-2 years":  18,
  "2+ years":   30,
};

/**
 * Availability urgency → weight modifier
 */
const AVAILABILITY_SCORES = {
  "immediate": 1.0,
  "1 month":   0.8,
  "2 months":  0.6,
  "3 months":  0.4,
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Skill Normalizer & Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize a skill string for comparison
 * "Node.JS" → "nodejs", "React.js" → "reactjs", "C++" → "c++"
 */
const normalizeSkill = (skill) => {
  if (typeof skill !== "string") return "";
  return skill
    .toLowerCase()
    .trim()
    .replace(/\.js$/i, "js")       // React.js → reactjs
    .replace(/\s+/g, "")           // scikit learn → scikitlearn
    .replace(/[^a-z0-9#+]/g, ""); // keep alphanumeric and symbols
};

/**
 * Create a normalized Set from an array of skill strings
 */
const toNormalizedSet = (skills) => {
  if (!Array.isArray(skills)) return new Set();
  return new Set(skills.map(normalizeSkill).filter(Boolean));
};

/**
 * Jaccard similarity between two skill arrays
 * |A ∩ B| / |A ∪ B|
 * Returns 0.0 – 1.0
 */
const jaccardSimilarity = (skillsA, skillsB) => {
  const a = toNormalizedSet(skillsA);
  const b = toNormalizedSet(skillsB);

  if (a.size === 0 && b.size === 0) return 0;
  if (a.size === 0 || b.size === 0) return 0;

  const intersectionSize = [...a].filter((x) => b.has(x)).length;
  const unionSize = new Set([...a, ...b]).size;

  return intersectionSize / unionSize;
};

/**
 * Find exact matched skills (for display in explanation)
 */
const findMatchedSkills = (candidateSkills, requiredSkills) => {
  const cNorm = toNormalizedSet(candidateSkills);
  return (requiredSkills || []).filter((rs) => cNorm.has(normalizeSkill(rs)));
};

/**
 * Find missing required skills (gap analysis)
 */
const findMissingSkills = (candidateSkills, requiredSkills) => {
  const cNorm = toNormalizedSet(candidateSkills);
  return (requiredSkills || []).filter((rs) => !cNorm.has(normalizeSkill(rs)));
};

/**
 * Calculate semantic cluster bonus
 *
 * If candidate and internship share skills in the same cluster,
 * award a small bonus even if the exact skill names differ slightly.
 *
 * Returns 0.0 – 1.0 (proportion of clusters with overlap)
 */
const clusterBonus = (candidateSkills, requiredSkills) => {
  const cNorm = toNormalizedSet(candidateSkills);
  const rNorm = toNormalizedSet(requiredSkills);

  let clustersWithOverlap = 0;
  const totalClusters = Object.keys(SKILL_CLUSTERS).length;

  for (const clusterSkills of Object.values(SKILL_CLUSTERS)) {
    const cInCluster = clusterSkills.some((s) => cNorm.has(normalizeSkill(s)));
    const rInCluster = clusterSkills.some((s) => rNorm.has(normalizeSkill(s)));
    if (cInCluster && rInCluster) clustersWithOverlap++;
  }

  return clustersWithOverlap / totalClusters;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Individual Dimension Scorers (each returns 0.0 – 1.0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SKILL SCORE
 * ─────────────
 * Combines three signals:
 *   a) Jaccard on required skills    (weight 0.60) — hard requirements
 *   b) Jaccard on preferred skills   (weight 0.25) — nice-to-have
 *   c) Semantic cluster overlap      (weight 0.15) — domain alignment
 *
 * @param {string[]} candidateSkills
 * @param {string[]} requiredSkills
 * @param {string[]} preferredSkills
 * @returns {number} 0.0 – 1.0
 */
const scoreSkills = (candidateSkills, requiredSkills = [], preferredSkills = []) => {
  if (!requiredSkills.length && !preferredSkills.length) return 0.5; // No requirement = neutral

  const reqJaccard  = jaccardSimilarity(candidateSkills, requiredSkills);
  const prefJaccard = preferredSkills.length
    ? jaccardSimilarity(candidateSkills, preferredSkills)
    : 0;
  const cluster = clusterBonus(candidateSkills, [...requiredSkills, ...preferredSkills]);

  return reqJaccard * 0.60 + prefJaccard * 0.25 + cluster * 0.15;
};

/**
 * EDUCATION SCORE
 * ─────────────────
 * Compares highest candidate degree tier against requirement tier.
 * Rewards over-qualification slightly less to keep rankings fair.
 *
 * @param {Object[]} candidateEducation  Array of { degree, field }
 * @param {string}   requiredEducation   e.g. "B.Tech", "Any Graduate"
 * @returns {number} 0.0 – 1.0
 */
const scoreEducation = (candidateEducation, requiredEducation) => {
  if (!requiredEducation || requiredEducation.toLowerCase().includes("any")) return 0.75;
  if (!candidateEducation || candidateEducation.length === 0) return 0.30;

  const reqLower = requiredEducation.toLowerCase();

  // Check if internship requires a specific field
  const fieldKeywords = ["computer", "information", "electronics", "electrical", "mechanical", "civil", "math"];
  const fieldRequired = fieldKeywords.some((f) => reqLower.includes(f));

  // Find candidate's highest degree tier
  let candidateTier = 0;
  let fieldMatch = false;

  for (const edu of candidateEducation) {
    const degreeLower = (edu.degree || "").toLowerCase();
    const fieldLower  = (edu.field  || "").toLowerCase();

    for (const [keyword, tier] of Object.entries(DEGREE_TIERS)) {
      if (degreeLower.includes(keyword) && tier > candidateTier) {
        candidateTier = tier;
      }
    }

    if (fieldRequired) {
      fieldMatch = fieldMatch || fieldKeywords.some((f) => fieldLower.includes(f) || degreeLower.includes(f));
    }
  }

  // Find required tier
  let requiredTier = 0;
  for (const [keyword, tier] of Object.entries(DEGREE_TIERS)) {
    if (reqLower.includes(keyword) && tier > requiredTier) requiredTier = tier;
  }

  if (requiredTier === 0) return 0.75; // Can't determine requirement → neutral

  // Score based on tier gap
  let score;
  if (candidateTier >= requiredTier) {
    // Met or exceeded — full score, with small over-qualification penalty
    const overQualPenalty = Math.max(0, (candidateTier - requiredTier) * 0.05);
    score = Math.max(0.8, 1.0 - overQualPenalty);
  } else {
    // Under-qualified — proportional penalty
    const gap = requiredTier - candidateTier;
    score = Math.max(0.1, 1.0 - gap * 0.25);
  }

  // Field match bonus (if relevant)
  if (fieldRequired && fieldMatch) score = Math.min(1.0, score + 0.1);

  return parseFloat(score.toFixed(3));
};

/**
 * EXPERIENCE SCORE
 * ──────────────────
 * Compares candidate months of experience vs. required months.
 * Over-experience is not penalized (internships welcome all).
 * Under-experience has a soft decay.
 *
 * @param {string} candidateLevel  e.g. "fresher", "1-2 years"
 * @param {string} requiredLevel   e.g. "fresher", "0-1 years"
 * @returns {number} 0.0 – 1.0
 */
const scoreExperience = (candidateLevel, requiredLevel) => {
  const candidateMonths = EXP_MONTHS[candidateLevel] ?? 0;
  const requiredMonths  = EXP_MONTHS[requiredLevel]  ?? 0;

  if (requiredMonths === 0) return 1.0; // No requirement

  if (candidateMonths >= requiredMonths) {
    return 1.0; // Meets or exceeds requirement
  }

  // Soft penalty: score decays as gap increases
  const gap = requiredMonths - candidateMonths;
  const score = Math.max(0.1, 1.0 - (gap / requiredMonths) * 0.7);
  return parseFloat(score.toFixed(3));
};

/**
 * LOCATION SCORE
 * ────────────────
 * Tiered matching:
 *   Exact city match         → 1.0
 *   Same state / region      → 0.8
 *   Remote (candidate pref)  → 1.0
 *   Remote (internship)      → 0.9  (slightly penalized if candidate wants onsite)
 *   No preference specified  → 0.5
 *   No match                 → 0.2
 *
 * @param {string[]} candidateLocations  e.g. ["Mumbai", "Remote", "Pune"]
 * @param {string}   internshipLocation  e.g. "Mumbai"
 * @param {boolean}  isRemote            Internship is remote
 * @returns {number} 0.0 – 1.0
 */
const scoreLocation = (candidateLocations, internshipLocation, isRemote = false) => {
  if (!candidateLocations || candidateLocations.length === 0) return 0.5;

  const prefNorm  = candidateLocations.map((l) => l.toLowerCase().trim());
  const internNorm = (internshipLocation || "").toLowerCase().trim();

  // Candidate wants remote
  const candidateWantsRemote = prefNorm.some((l) => ["remote", "anywhere", "work from home", "wfh"].includes(l));

  // Internship is remote
  if (isRemote || internNorm === "remote" || internNorm === "work from home") {
    return candidateWantsRemote ? 1.0 : 0.85; // Remote is good even if not preferred
  }

  // Exact city match
  if (prefNorm.includes(internNorm)) return 1.0;

  // Candidate accepts remote → partial for any location
  if (candidateWantsRemote) return 0.6;

  // Partial string match (same city, different formatting)
  const partialMatch = prefNorm.some(
    (l) => internNorm.includes(l) || l.includes(internNorm) || l.split(",")[0] === internNorm.split(",")[0]
  );
  if (partialMatch) return 0.85;

  // State-level match heuristic
  const stateMatch = checkStateMatch(prefNorm, internNorm);
  if (stateMatch) return 0.7;

  return 0.2;
};

/**
 * Simple state-level matching for Indian cities
 */
const CITY_STATE_MAP = {
  mumbai: "maharashtra", pune: "maharashtra", nashik: "maharashtra", nagpur: "maharashtra",
  delhi: "delhi", "new delhi": "delhi", noida: "uttar pradesh", gurgaon: "haryana", gurugram: "haryana",
  bangalore: "karnataka", bengaluru: "karnataka", mysore: "karnataka",
  hyderabad: "telangana", secunderabad: "telangana",
  chennai: "tamil nadu", coimbatore: "tamil nadu",
  kolkata: "west bengal",
  ahmedabad: "gujarat", surat: "gujarat",
  jaipur: "rajasthan",
  chandigarh: "punjab",
  lucknow: "uttar pradesh", kanpur: "uttar pradesh",
  bhopal: "madhya pradesh", indore: "madhya pradesh",
};

const checkStateMatch = (candidateLocations, internLocation) => {
  const internState = CITY_STATE_MAP[internLocation];
  if (!internState) return false;
  return candidateLocations.some((loc) => CITY_STATE_MAP[loc] === internState);
};

/**
 * AVAILABILITY SCORE
 * ────────────────────
 * Simple lookup — immediate joiners rank higher for urgent openings.
 *
 * @param {string} candidateAvailability
 * @returns {number} 0.0 – 1.0
 */
const scoreAvailability = (candidateAvailability) => {
  return AVAILABILITY_SCORES[candidateAvailability] ?? 0.5;
};

/**
 * PROFILE QUALITY SCORE
 * ───────────────────────
 * Bonus for complete profiles (resume uploaded, bio, links, etc.)
 * Incentivizes candidates to complete their profiles.
 *
 * @param {Object} candidate  Candidate document
 * @returns {number} 0.0 – 1.0
 */
const scoreProfileQuality = (candidate) => {
  let score = 0;
  if (candidate.resumeUrl)                               score += 0.30;
  if (candidate.bio && candidate.bio.length > 50)        score += 0.15;
  if (candidate.skills   && candidate.skills.length >= 5) score += 0.20;
  if (candidate.education && candidate.education.length)  score += 0.15;
  if (candidate.linkedIn || candidate.github)             score += 0.10;
  if (candidate.projects && candidate.projects.length)    score += 0.10;
  return Math.min(score, 1.0);
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Master Score Calculator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate comprehensive match score between a candidate and an internship.
 *
 * @param {Object} candidate   Mongoose Candidate document (populated)
 * @param {Object} internship  Mongoose Internship document (populated)
 * @returns {MatchResult}
 *
 * @typedef {Object} MatchResult
 * @property {number}   score          Final score 0–100
 * @property {Object}   breakdown      Per-dimension raw scores (0–1 each)
 * @property {string[]} matchedSkills  Required skills the candidate has
 * @property {string[]} missingSkills  Required skills the candidate lacks
 * @property {string}   strengthLevel  "Excellent" | "Good" | "Fair" | "Weak"
 */
const calculateMatchScore = (candidate, internship) => {
  // ── Extract candidate features ──────────────────────────────────────────
  const candidateSkills    = candidate.skills            || [];
  const candidateEducation = candidate.education         || [];
  const candidateLevel     = candidate.experienceLevel   || "fresher";
  const candidateLocations = candidate.locationPreferences || [];
  const candidateAvail     = candidate.availability      || "immediate";

  // ── Extract internship features ─────────────────────────────────────────
  const requiredSkills   = internship.requiredSkills   || [];
  const preferredSkills  = internship.preferredSkills  || [];
  const requiredEdu      = internship.educationRequired || "";
  const requiredLevel    = internship.experienceRequired || "fresher";
  const internLocation   = internship.location          || "";
  const isRemote         = internship.isRemote           || false;

  // ── Score each dimension ────────────────────────────────────────────────
  const skillRaw    = scoreSkills(candidateSkills, requiredSkills, preferredSkills);
  const eduRaw      = scoreEducation(candidateEducation, requiredEdu);
  const expRaw      = scoreExperience(candidateLevel, requiredLevel);
  const locRaw      = scoreLocation(candidateLocations, internLocation, isRemote);
  const availRaw    = scoreAvailability(candidateAvail);
  const profileRaw  = scoreProfileQuality(candidate);

  // ── Weighted sum → 0–100 ────────────────────────────────────────────────
  const rawScore =
    skillRaw   * WEIGHTS.SKILL        +
    eduRaw     * WEIGHTS.EDUCATION    +
    expRaw     * WEIGHTS.EXPERIENCE   +
    locRaw     * WEIGHTS.LOCATION     +
    availRaw   * WEIGHTS.AVAILABILITY +
    profileRaw * WEIGHTS.PROFILE;

  const score = parseFloat(Math.min(rawScore * 100, 100).toFixed(1));

  // ── Derive insight fields ───────────────────────────────────────────────
  const matchedSkills = findMatchedSkills(candidateSkills, requiredSkills);
  const missingSkills = findMissingSkills(candidateSkills, requiredSkills);

  const strengthLevel =
    score >= 75 ? "Excellent" :
    score >= 55 ? "Good"      :
    score >= 35 ? "Fair"      : "Weak";

  return {
    score,
    breakdown: {
      skill:        parseFloat((skillRaw   * 100).toFixed(1)),
      education:    parseFloat((eduRaw     * 100).toFixed(1)),
      experience:   parseFloat((expRaw     * 100).toFixed(1)),
      location:     parseFloat((locRaw     * 100).toFixed(1)),
      availability: parseFloat((availRaw   * 100).toFixed(1)),
      profile:      parseFloat((profileRaw * 100).toFixed(1)),
    },
    matchedSkills,
    missingSkills,
    strengthLevel,
    weights: WEIGHTS,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Batch Recommender (Top-N Engine)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score all internships against a candidate and return the top N results.
 *
 * @param {Object}   candidate    Candidate document
 * @param {Object[]} internships  Array of Internship documents
 * @param {number}   topN        Number of results to return (default 10)
 * @returns {ScoredInternship[]}
 *
 * @typedef {Object} ScoredInternship
 * @property {Object}   internship
 * @property {number}   score
 * @property {Object}   breakdown
 * @property {string[]} matchedSkills
 * @property {string[]} missingSkills
 * @property {string}   strengthLevel
 * @property {string}   explanation     Short auto-generated text reason
 */
const getTopRecommendations = (candidate, internships, topN = 10) => {
  if (!internships || internships.length === 0) return [];

  const scored = internships
    .map((internship) => {
      const result = calculateMatchScore(candidate, internship);
      return {
        internship,
        ...result,
        explanation: buildFallbackExplanation(candidate, internship, result),
      };
    })
    .filter((item) => item.score >= MIN_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
};

/**
 * Build a rule-based short explanation for a match
 * (used as fallback when Gemini is unavailable)
 */
const buildFallbackExplanation = (candidate, internship, result) => {
  const { matchedSkills, score, breakdown } = result;
  const company = internship.company?.companyName || "this company";

  const parts = [];

  if (matchedSkills.length > 0) {
    const topSkills = matchedSkills.slice(0, 3).join(", ");
    parts.push(`your ${topSkills} skills match the core requirements`);
  }

  if (breakdown.location >= 70) {
    parts.push("your location preference aligns well");
  }

  if (breakdown.experience >= 80) {
    parts.push("your experience level is a strong fit");
  }

  if (breakdown.education >= 80) {
    parts.push("your educational background meets the requirement");
  }

  if (parts.length === 0) {
    return `You are a ${score >= 50 ? "good" : "partial"} match for the ${internship.title} role at ${company} with a ${Math.round(score)}% compatibility score.`;
  }

  return `You are recommended for ${internship.title} at ${company} because ${parts.join(", and ")}.`;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Company-Side: Candidate Ranking for an Internship
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given an internship, rank a list of candidates by match score.
 * Used by the company dashboard to see best-fit applicants.
 *
 * @param {Object}   internship  Internship document
 * @param {Object[]} candidates  Array of Candidate documents
 * @param {number}   topN        Max results
 * @returns {RankedCandidate[]}
 */
const rankCandidatesForInternship = (internship, candidates, topN = 20) => {
  if (!candidates || candidates.length === 0) return [];

  const ranked = candidates
    .map((candidate) => {
      const result = calculateMatchScore(candidate, internship);
      return {
        candidate,
        ...result,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return ranked;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — Analytics Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute score distribution statistics for a set of scored internships.
 * Useful for admin dashboards.
 *
 * @param {number[]} scores
 * @returns {Object} { mean, median, min, max, std, distribution }
 */
const computeScoreStats = (scores) => {
  if (!scores || scores.length === 0) return null;

  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = scores.reduce((s, v) => s + v, 0) / n;
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  // Bucket into ranges: 0-20, 20-40, 40-60, 60-80, 80-100
  const distribution = { "0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0 };
  scores.forEach((s) => {
    if      (s < 20)  distribution["0-20"]++;
    else if (s < 40)  distribution["20-40"]++;
    else if (s < 60)  distribution["40-60"]++;
    else if (s < 80)  distribution["60-80"]++;
    else              distribution["80-100"]++;
  });

  return {
    mean:         parseFloat(mean.toFixed(2)),
    median:       parseFloat(median.toFixed(2)),
    min:          sorted[0],
    max:          sorted[n - 1],
    std:          parseFloat(std.toFixed(2)),
    count:        n,
    distribution,
  };
};

/**
 * Get skill gap summary across all recommendations.
 * Tells a candidate which skills to learn to improve their match rate.
 *
 * @param {ScoredInternship[]} recommendations
 * @returns {Object[]} Sorted array of { skill, frequency, avgScoreImpact }
 */
const getSkillGapSummary = (recommendations) => {
  const skillFreq = {};

  for (const rec of recommendations) {
    for (const skill of rec.missingSkills || []) {
      skillFreq[skill] = (skillFreq[skill] || 0) + 1;
    }
  }

  return Object.entries(skillFreq)
    .map(([skill, frequency]) => ({ skill, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Primary API
  calculateMatchScore,
  getTopRecommendations,
  rankCandidatesForInternship,

  // Analytics
  computeScoreStats,
  getSkillGapSummary,
  buildFallbackExplanation,

  // Exported for testing
  normalizeSkill,
  toNormalizedSet,
  jaccardSimilarity,
  findMatchedSkills,
  findMissingSkills,
  clusterBonus,
  scoreSkills,
  scoreEducation,
  scoreExperience,
  scoreLocation,
  scoreAvailability,
  scoreProfileQuality,
  checkStateMatch,

  // Constants
  WEIGHTS,
  SKILL_CLUSTERS,
  DEGREE_TIERS,
  EXP_MONTHS,
  MIN_SCORE_THRESHOLD,
};
