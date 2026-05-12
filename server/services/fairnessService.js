/**
 * services/fairnessService.js
 * ════════════════════════════════════════════════════════════════════════════
 * Fairness-Aware Re-ranking Module
 *
 * APPROACH: Post-processing fairness intervention (Disparate Impact mitigation)
 *
 * After the matching engine produces a ranked list, this module:
 *   1. Applies a small score boost for underrepresented diversity categories
 *   2. Ensures no single category dominates the top-N results (quota guard)
 *   3. Logs fairness metadata transparently for audit
 *
 * DIVERSITY CATEGORIES (Indian EEO framework)
 *   SC   — Scheduled Caste
 *   ST   — Scheduled Tribe
 *   OBC  — Other Backward Classes
 *   PWD  — Persons with Disability
 *   EWS  — Economically Weaker Section
 *   General — No category / unreserved
 *
 * BOOST VALUES (additive, applied to 0–100 score)
 *   These values are calibrated to be meaningful but not override merit.
 *   SC:  +5 pts     ST:  +7 pts     OBC: +3 pts
 *   PWD: +8 pts     EWS: +4 pts     General: 0 pts
 *
 * QUOTA GUARD (for company-side candidate ranking)
 *   Prevents any single category from filling more than 60% of top-10 slots.
 *   Triggered only when diversity pool is large enough.
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Configuration
// ─────────────────────────────────────────────────────────────────────────────

/** Additive fairness boost (in score points, 0–100 scale) */
const FAIRNESS_BOOST_POINTS = {
  SC:      5,
  ST:      7,
  OBC:     3,
  PWD:     8,
  EWS:     4,
  General: 0,
};

/** Max proportion of top-N any single category may occupy (for quota guard) */
const CATEGORY_QUOTA = 0.60;

/** Minimum candidates in pool before quota guard activates */
const QUOTA_GUARD_MIN_POOL = 15;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Primary Re-ranking Function (Candidate View)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-rank a scored recommendation list for a specific candidate.
 *
 * For the candidate-facing flow, the boost is applied to the CANDIDATE's
 * own score on all matched internships (not to other candidates).
 * This gives underrepresented candidates slightly higher visibility.
 *
 * @param {ScoredInternship[]} scoredList       Output from matchingEngine.getTopRecommendations
 * @param {string}             diversityCategory Candidate's declared category
 * @param {number}             topN             Final list size
 * @returns {ScoredInternship[]} Re-ranked list with fairness metadata attached
 */
const applyFairnessReranking = (scoredList, diversityCategory = "General", topN = 10) => {
  const boost = FAIRNESS_BOOST_POINTS[diversityCategory] ?? 0;
  const boostFraction = boost / 100; // Convert to 0–1 scale

  const adjusted = scoredList.map((item) => {
    const adjustedScore = Math.min(parseFloat((item.score + boost).toFixed(1)), 100);

    return {
      ...item,
      score:           adjustedScore,
      originalScore:   item.score,
      fairnessApplied: boost > 0,
      fairnessBoost:   boost,
      fairnessCategory: diversityCategory,
    };
  });

  // Re-sort after boost and return top N
  return adjusted
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Company-Side Quota Guard (Candidate Ranking)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply fairness re-ranking to a list of CANDIDATES for a given internship.
 * Used in the company dashboard to ensure diverse shortlists.
 *
 * Algorithm:
 *   1. Add per-candidate fairness boost based on their diversity category
 *   2. Re-sort by adjusted score
 *   3. Apply quota guard: if one category > 60% of top-N, promote others
 *
 * @param {RankedCandidate[]} rankedCandidates   Output from rankCandidatesForInternship
 * @param {number}            topN               Final shortlist size
 * @returns {RankedCandidate[]} Fair shortlist with diversity metadata
 */
const applyCompanyFairness = (rankedCandidates, topN = 10) => {
  if (!rankedCandidates || rankedCandidates.length === 0) return [];

  // Step 1: Apply per-candidate boost
  const boosted = rankedCandidates.map((item) => {
    const category = item.candidate?.diversityCategory || "General";
    const boost = FAIRNESS_BOOST_POINTS[category] ?? 0;
    return {
      ...item,
      score:            Math.min(parseFloat((item.score + boost).toFixed(1)), 100),
      originalScore:    item.score,
      fairnessBoost:    boost,
      fairnessCategory: category,
    };
  });

  // Step 2: Re-sort
  boosted.sort((a, b) => b.score - a.score);

  // Step 3: Quota guard (only if pool is large enough)
  if (rankedCandidates.length < QUOTA_GUARD_MIN_POOL) {
    return boosted.slice(0, topN);
  }

  return applyQuotaGuard(boosted, topN);
};

/**
 * Quota guard: ensure no single category fills > 60% of top-N slots.
 *
 * Uses a greedy insertion approach:
 *   - Build final list slot by slot
 *   - At each slot, pick the highest-scoring remaining candidate
 *     unless their category is already at quota, then pick next best
 *
 * @param {RankedCandidate[]} sorted  Candidates sorted by adjusted score
 * @param {number}            topN
 * @returns {RankedCandidate[]}
 */
const applyQuotaGuard = (sorted, topN) => {
  const maxPerCategory = Math.floor(topN * CATEGORY_QUOTA);
  const categoryCounts = {};
  const result = [];
  const remaining = [...sorted];

  while (result.length < topN && remaining.length > 0) {
    let selected = null;
    let selectedIdx = -1;

    for (let i = 0; i < remaining.length; i++) {
      const cat = remaining[i].fairnessCategory || "General";
      const count = categoryCounts[cat] || 0;

      if (count < maxPerCategory) {
        selected = remaining[i];
        selectedIdx = i;
        break;
      }
    }

    // If all remaining are over quota, just add the top scorer (graceful fallback)
    if (!selected) {
      selected = remaining[0];
      selectedIdx = 0;
    }

    result.push({ ...selected, quotaGuardApplied: true });
    categoryCounts[selected.fairnessCategory] = (categoryCounts[selected.fairnessCategory] || 0) + 1;
    remaining.splice(selectedIdx, 1);
  }

  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Diversity Analytics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute diversity breakdown from a list of candidate objects.
 * Used in admin analytics dashboard.
 *
 * @param {Object[]} candidates  Array of Candidate documents
 * @returns {DiversityStats}
 *
 * @typedef {Object} DiversityStats
 * @property {Object}  counts       Category → count
 * @property {Object}  percentages  Category → { count, pct }
 * @property {number}  total
 * @property {string}  dominantCategory
 * @property {number}  diversityIndex  Shannon entropy (0–1)
 */
const computeDiversityStats = (candidates) => {
  const counts = { General: 0, SC: 0, ST: 0, OBC: 0, PWD: 0, EWS: 0 };

  for (const c of candidates) {
    const cat = c.diversityCategory || "General";
    counts[cat] = (counts[cat] || 0) + 1;
  }

  const total = candidates.length || 1;

  const percentages = {};
  for (const [cat, count] of Object.entries(counts)) {
    percentages[cat] = {
      count,
      pct: parseFloat(((count / total) * 100).toFixed(1)),
    };
  }

  // Dominant category
  const dominantCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  // Shannon diversity index (normalized to 0–1)
  const diversityIndex = computeShannonEntropy(Object.values(counts), total);

  return { counts, percentages, total, dominantCategory, diversityIndex };
};

/**
 * Shannon entropy: measures how evenly distributed the categories are.
 * 0 = all one category, 1 = perfectly uniform distribution
 */
const computeShannonEntropy = (countValues, total) => {
  const nonZero = countValues.filter((c) => c > 0);
  if (nonZero.length <= 1) return 0;

  const entropy = nonZero.reduce((sum, count) => {
    const p = count / total;
    return sum - p * Math.log2(p);
  }, 0);

  const maxEntropy = Math.log2(nonZero.length);
  return maxEntropy === 0 ? 0 : parseFloat((entropy / maxEntropy).toFixed(3));
};

/**
 * Compute diversity stats for a specific result set (e.g. top-10 recommendations)
 * to measure whether the fairness system is working.
 *
 * @param {ScoredInternship[]|RankedCandidate[]} results
 * @param {string} candidateField  Field path to diversity category
 * @returns {Object}
 */
const computeResultDiversity = (results, candidateField = "fairnessCategory") => {
  const cats = results.map((r) => r[candidateField] || "General");
  const counts = {};
  cats.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
  return counts;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Primary API
  applyFairnessReranking,
  applyCompanyFairness,
  applyQuotaGuard,

  // Analytics
  computeDiversityStats,
  computeShannonEntropy,
  computeResultDiversity,

  // Constants
  FAIRNESS_BOOST_POINTS,
  CATEGORY_QUOTA,
  QUOTA_GUARD_MIN_POOL,
};
