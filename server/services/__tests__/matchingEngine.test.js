/**
 * services/__tests__/matchingEngine.test.js
 * Comprehensive unit tests for the matching engine
 * Run: cd server && npx jest matchingEngine.test.js --verbose
 */

"use strict";

const {
  normalizeSkill,
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
  calculateMatchScore,
  getTopRecommendations,
  computeScoreStats,
  getSkillGapSummary,
  WEIGHTS,
} = require("../matchingEngine");

const {
  applyFairnessReranking,
  applyCompanyFairness,
  computeDiversityStats,
  computeShannonEntropy,
  FAIRNESS_BOOST_POINTS,
} = require("../fairnessService");

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockCandidate = {
  skills: ["Python", "React", "Node.js", "MongoDB", "Machine Learning", "Docker"],
  education: [{ degree: "B.Tech", field: "Computer Science", endYear: "2023" }],
  experienceLevel: "0-1 years",
  locationPreferences: ["Mumbai", "Pune", "Remote"],
  availability: "immediate",
  resumeUrl: "/uploads/resume.pdf",
  bio: "Passionate software engineer with a love for building scalable applications",
  linkedIn: "https://linkedin.com/in/test",
  projects: [{ title: "Resume Parser", technologies: ["Python"] }],
  diversityCategory: "General",
};

const mockInternship = {
  title: "Full Stack Developer Intern",
  requiredSkills: ["React", "Node.js", "MongoDB"],
  preferredSkills: ["Docker", "Python"],
  educationRequired: "B.Tech",
  experienceRequired: "fresher",
  location: "Mumbai",
  isRemote: false,
  company: { companyName: "TechCorp" },
};

// ─── SECTION A: Utility Functions ────────────────────────────────────────────

describe("normalizeSkill", () => {
  test("lowercases input", () => expect(normalizeSkill("Python")).toBe("python"));
  test("removes .js suffix", () => expect(normalizeSkill("React.js")).toBe("reactjs"));
  test("removes spaces", () => expect(normalizeSkill("Node.js")).toBe("nodejs"));
  test("handles C++", () => expect(normalizeSkill("C++")).toBe("c++"));
  test("handles empty string", () => expect(normalizeSkill("")).toBe(""));
  test("handles non-string", () => expect(normalizeSkill(null)).toBe(""));
});

describe("jaccardSimilarity", () => {
  test("identical sets → 1.0", () => {
    expect(jaccardSimilarity(["Python", "React"], ["Python", "React"])).toBe(1);
  });
  test("disjoint sets → 0.0", () => {
    expect(jaccardSimilarity(["Python"], ["Java"])).toBe(0);
  });
  test("partial overlap", () => {
    const sim = jaccardSimilarity(["Python", "React", "Node.js"], ["Python", "Django"]);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });
  test("empty sets → 0.0", () => {
    expect(jaccardSimilarity([], [])).toBe(0);
  });
  test("one empty set → 0.0", () => {
    expect(jaccardSimilarity(["Python"], [])).toBe(0);
  });
  test("case-insensitive matching", () => {
    const sim = jaccardSimilarity(["python"], ["Python"]);
    expect(sim).toBe(1);
  });
});

describe("findMatchedSkills", () => {
  test("returns skills present in both arrays", () => {
    const matched = findMatchedSkills(["Python", "React", "Java"], ["React", "Node.js"]);
    expect(matched).toContain("React");
    expect(matched).not.toContain("Python");
    expect(matched).not.toContain("Node.js");
  });
  test("returns empty for no match", () => {
    expect(findMatchedSkills(["Python"], ["Java"])).toHaveLength(0);
  });
});

describe("findMissingSkills", () => {
  test("returns required skills candidate lacks", () => {
    const missing = findMissingSkills(["React"], ["React", "Node.js", "MongoDB"]);
    expect(missing).toContain("Node.js");
    expect(missing).toContain("MongoDB");
    expect(missing).not.toContain("React");
  });
});

describe("clusterBonus", () => {
  test("same cluster → bonus > 0", () => {
    // Python + TensorFlow are in python_ml cluster
    const bonus = clusterBonus(["Python", "TensorFlow"], ["Machine Learning", "Deep Learning"]);
    expect(bonus).toBeGreaterThan(0);
  });
  test("different clusters → 0", () => {
    const bonus = clusterBonus(["React"], ["Docker", "Kubernetes"]);
    expect(bonus).toBeGreaterThanOrEqual(0);
    expect(bonus).toBeLessThanOrEqual(1);
  });
});

// ─── SECTION B: Dimension Scorers ─────────────────────────────────────────────

describe("scoreSkills", () => {
  test("exact required match → high score", () => {
    const score = scoreSkills(["React", "Node.js"], ["React", "Node.js"]);
    expect(score).toBeGreaterThan(0.6);
  });
  test("no skills → returns 0", () => {
    expect(scoreSkills([], ["Python", "React"])).toBe(0);
  });
  test("no requirement → returns 0.5 neutral", () => {
    expect(scoreSkills(["Python"], [], [])).toBe(0.5);
  });
  test("returns 0–1 range", () => {
    const s = scoreSkills(["Python", "Flask"], ["Django", "React", "Node.js"]);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

describe("scoreEducation", () => {
  test("matching degree → high score", () => {
    const edu = [{ degree: "B.Tech", field: "Computer Science" }];
    const score = scoreEducation(edu, "B.Tech");
    expect(score).toBeGreaterThan(0.75);
  });
  test("no requirement → 0.75 neutral", () => {
    const score = scoreEducation([], "Any Graduate");
    expect(score).toBe(0.75);
  });
  test("no education provided → low score", () => {
    const score = scoreEducation([], "B.Tech");
    expect(score).toBe(0.30);
  });
  test("higher degree than required → still high", () => {
    const edu = [{ degree: "M.Tech", field: "CS" }];
    const score = scoreEducation(edu, "B.Tech");
    expect(score).toBeGreaterThan(0.75);
  });
  test("much lower degree than required → penalized", () => {
    const edu = [{ degree: "10th", field: "" }];
    const score = scoreEducation(edu, "B.Tech");
    expect(score).toBeLessThan(0.5);
  });
});

describe("scoreExperience", () => {
  test("matches fresher requirement → 1.0", () => {
    expect(scoreExperience("fresher", "fresher")).toBe(1.0);
  });
  test("over-qualified → 1.0 (no penalty for interns)", () => {
    expect(scoreExperience("2+ years", "fresher")).toBe(1.0);
  });
  test("under-qualified → penalized", () => {
    const score = scoreExperience("fresher", "2+ years");
    expect(score).toBeLessThan(0.7);
    expect(score).toBeGreaterThan(0);
  });
  test("no requirement → 1.0", () => {
    expect(scoreExperience("fresher", "fresher")).toBe(1.0);
  });
});

describe("scoreLocation", () => {
  test("exact city match → 1.0", () => {
    expect(scoreLocation(["Mumbai", "Pune"], "Mumbai")).toBe(1.0);
  });
  test("remote internship → 0.85+", () => {
    expect(scoreLocation(["Mumbai"], "Bangalore", true)).toBeGreaterThanOrEqual(0.85);
  });
  test("candidate wants remote → high for any location", () => {
    expect(scoreLocation(["Remote", "Anywhere"], "Hyderabad")).toBeGreaterThan(0.5);
  });
  test("no location preference → 0.5 neutral", () => {
    expect(scoreLocation([], "Mumbai")).toBe(0.5);
  });
  test("no match → 0.2", () => {
    expect(scoreLocation(["Kolkata"], "Bangalore", false)).toBeLessThanOrEqual(0.7);
  });
});

describe("scoreAvailability", () => {
  test("immediate → 1.0", () => expect(scoreAvailability("immediate")).toBe(1.0));
  test("1 month → 0.8", () => expect(scoreAvailability("1 month")).toBe(0.8));
  test("3 months → 0.4", () => expect(scoreAvailability("3 months")).toBe(0.4));
  test("unknown → 0.5 neutral", () => expect(scoreAvailability("unknown")).toBe(0.5));
});

describe("scoreProfileQuality", () => {
  test("complete profile → high score", () => {
    const score = scoreProfileQuality(mockCandidate);
    expect(score).toBeGreaterThan(0.7);
  });
  test("empty profile → low score", () => {
    const score = scoreProfileQuality({});
    expect(score).toBe(0);
  });
  test("resume uploaded → adds 0.30", () => {
    const s1 = scoreProfileQuality({});
    const s2 = scoreProfileQuality({ resumeUrl: "/uploads/r.pdf" });
    expect(s2 - s1).toBeCloseTo(0.30);
  });
});

// ─── SECTION C: Master Score Calculator ──────────────────────────────────────

describe("calculateMatchScore", () => {
  test("returns score in 0–100 range", () => {
    const result = calculateMatchScore(mockCandidate, mockInternship);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test("strong match → score > 60", () => {
    const result = calculateMatchScore(mockCandidate, mockInternship);
    expect(result.score).toBeGreaterThan(60);
  });

  test("weak match → lower score", () => {
    const weakCandidate = { ...mockCandidate, skills: ["Photoshop", "Illustrator"] };
    const result = calculateMatchScore(weakCandidate, mockInternship);
    expect(result.score).toBeLessThan(60);
  });

  test("returns breakdown object with all dimensions", () => {
    const result = calculateMatchScore(mockCandidate, mockInternship);
    expect(result.breakdown).toHaveProperty("skill");
    expect(result.breakdown).toHaveProperty("education");
    expect(result.breakdown).toHaveProperty("experience");
    expect(result.breakdown).toHaveProperty("location");
    expect(result.breakdown).toHaveProperty("availability");
    expect(result.breakdown).toHaveProperty("profile");
  });

  test("returns matchedSkills", () => {
    const result = calculateMatchScore(mockCandidate, mockInternship);
    expect(Array.isArray(result.matchedSkills)).toBe(true);
    expect(result.matchedSkills.length).toBeGreaterThan(0);
  });

  test("returns missingSkills", () => {
    const result = calculateMatchScore(mockCandidate, mockInternship);
    expect(Array.isArray(result.missingSkills)).toBe(true);
  });

  test("returns strengthLevel string", () => {
    const result = calculateMatchScore(mockCandidate, mockInternship);
    expect(["Excellent", "Good", "Fair", "Weak"]).toContain(result.strengthLevel);
  });

  test("weights sum to ~1.0", () => {
    const total = Object.values(WEIGHTS).reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(1.0, 2);
  });

  test("perfect skill match raises skill dimension", () => {
    const perfect = { ...mockCandidate, skills: ["React", "Node.js", "MongoDB", "Docker", "Python"] };
    const result = calculateMatchScore(perfect, mockInternship);
    expect(result.breakdown.skill).toBeGreaterThan(60);
  });
});

// ─── SECTION D: Top Recommendations ──────────────────────────────────────────

describe("getTopRecommendations", () => {
  const internships = Array.from({ length: 15 }, (_, i) => ({
    _id: `intern_${i}`,
    title: `Internship ${i}`,
    requiredSkills: i % 2 === 0 ? ["React", "Node.js"] : ["Java", "Spring Boot"],
    preferredSkills: [],
    educationRequired: "B.Tech",
    experienceRequired: "fresher",
    location: i % 3 === 0 ? "Mumbai" : "Delhi",
    isRemote: i % 5 === 0,
    status: "active",
    company: { companyName: `Company ${i}` },
  }));

  test("returns max topN results", () => {
    const results = getTopRecommendations(mockCandidate, internships, 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  test("results are sorted by score descending", () => {
    const results = getTopRecommendations(mockCandidate, internships, 10);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  test("returns empty for empty internships", () => {
    expect(getTopRecommendations(mockCandidate, [])).toHaveLength(0);
  });

  test("each result has required fields", () => {
    const results = getTopRecommendations(mockCandidate, internships, 3);
    for (const r of results) {
      expect(r).toHaveProperty("internship");
      expect(r).toHaveProperty("score");
      expect(r).toHaveProperty("breakdown");
      expect(r).toHaveProperty("matchedSkills");
      expect(r).toHaveProperty("explanation");
    }
  });

  test("filters below MIN_SCORE_THRESHOLD", () => {
    const zeroMatchCandidate = { ...mockCandidate, skills: [] };
    const results = getTopRecommendations(zeroMatchCandidate, internships, 10);
    results.forEach((r) => expect(r.score).toBeGreaterThanOrEqual(5));
  });
});

// ─── SECTION E: Analytics ─────────────────────────────────────────────────────

describe("computeScoreStats", () => {
  const scores = [45, 62, 78, 33, 91, 55, 70, 48, 66, 82];

  test("computes mean correctly", () => {
    const stats = computeScoreStats(scores);
    const expected = scores.reduce((s, v) => s + v, 0) / scores.length;
    expect(stats.mean).toBeCloseTo(expected, 1);
  });

  test("computes min and max", () => {
    const stats = computeScoreStats(scores);
    expect(stats.min).toBe(33);
    expect(stats.max).toBe(91);
  });

  test("distribution buckets sum to total", () => {
    const stats = computeScoreStats(scores);
    const total = Object.values(stats.distribution).reduce((s, v) => s + v, 0);
    expect(total).toBe(scores.length);
  });

  test("returns null for empty array", () => {
    expect(computeScoreStats([])).toBeNull();
  });
});

describe("getSkillGapSummary", () => {
  const recs = [
    { missingSkills: ["Docker", "Kubernetes"] },
    { missingSkills: ["Docker", "AWS"] },
    { missingSkills: ["Kubernetes", "Terraform"] },
    { missingSkills: ["Docker"] },
  ];

  test("returns sorted by frequency", () => {
    const gaps = getSkillGapSummary(recs);
    expect(gaps[0].skill).toBe("Docker");
    expect(gaps[0].frequency).toBe(3);
  });

  test("returns max 10 skills", () => {
    expect(getSkillGapSummary(recs).length).toBeLessThanOrEqual(10);
  });
});

// ─── SECTION F: Fairness Service ──────────────────────────────────────────────

describe("applyFairnessReranking", () => {
  const scored = [
    { internship: { _id: "1", title: "A" }, score: 80, originalScore: 80, matchedSkills: [], missingSkills: [] },
    { internship: { _id: "2", title: "B" }, score: 75, originalScore: 75, matchedSkills: [], missingSkills: [] },
    { internship: { _id: "3", title: "C" }, score: 70, originalScore: 70, matchedSkills: [], missingSkills: [] },
  ];

  test("General category → no boost", () => {
    const result = applyFairnessReranking(scored, "General", 3);
    expect(result[0].fairnessBoost).toBe(0);
  });

  test("PWD category → +8 points boost", () => {
    const result = applyFairnessReranking(scored, "PWD", 3);
    expect(result[0].fairnessBoost).toBe(FAIRNESS_BOOST_POINTS.PWD);
    expect(result[0].score).toBe(Math.min(80 + 8, 100));
  });

  test("SC category → +5 points boost", () => {
    const result = applyFairnessReranking(scored, "SC", 3);
    expect(result[0].fairnessBoost).toBe(5);
  });

  test("score capped at 100", () => {
    const highScored = [{ score: 98, matchedSkills: [], missingSkills: [] }];
    const result = applyFairnessReranking(highScored, "PWD", 1);
    expect(result[0].score).toBeLessThanOrEqual(100);
  });

  test("returns topN results", () => {
    const result = applyFairnessReranking(scored, "OBC", 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  test("attaches fairnessApplied flag", () => {
    const result = applyFairnessReranking(scored, "ST", 3);
    result.forEach((r) => expect(r.fairnessApplied).toBe(true));
  });
});

describe("computeDiversityStats", () => {
  const candidates = [
    { diversityCategory: "General" },
    { diversityCategory: "SC" },
    { diversityCategory: "SC" },
    { diversityCategory: "ST" },
    { diversityCategory: "OBC" },
    { diversityCategory: "PWD" },
  ];

  test("counts all categories", () => {
    const stats = computeDiversityStats(candidates);
    expect(stats.counts.SC).toBe(2);
    expect(stats.counts.ST).toBe(1);
    expect(stats.counts.General).toBe(1);
  });

  test("percentages sum to 100", () => {
    const stats = computeDiversityStats(candidates);
    const total = Object.values(stats.percentages).reduce((s, v) => s + v.pct, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  test("computes shannon diversity index between 0 and 1", () => {
    const stats = computeDiversityStats(candidates);
    expect(stats.diversityIndex).toBeGreaterThan(0);
    expect(stats.diversityIndex).toBeLessThanOrEqual(1);
  });

  test("uniform distribution → high diversity index", () => {
    const uniform = Array.from({ length: 6 }, (_, i) =>
      ({ diversityCategory: ["General","SC","ST","OBC","PWD","EWS"][i] })
    );
    const stats = computeDiversityStats(uniform);
    expect(stats.diversityIndex).toBeGreaterThan(0.9);
  });

  test("single category → diversity index 0", () => {
    const single = Array.from({ length: 5 }, () => ({ diversityCategory: "General" }));
    const stats = computeDiversityStats(single);
    expect(stats.diversityIndex).toBe(0);
  });
});
