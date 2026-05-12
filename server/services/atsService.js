/**
 * services/atsService.js — ATS (Applicant Tracking System) Scoring Engine
 *
 * Produces a full ATS report:
 *   - Quick score (0-100) from 4 categories: Skills, Keywords, Education, Experience
 *   - AI detailed breakdown via Gemini
 */
"use strict";

const { getGeminiModel } = require("../config/gemini");
const { logger }         = require("../middleware/logger");

// ── Category weights (must sum to 1.0) ───────────────────────────────────────
const WEIGHTS = {
  skills:     0.40,
  keywords:   0.25,
  education:  0.20,
  experience: 0.15,
};

// ── Common tech keywords by domain ───────────────────────────────────────────
const KEYWORD_DOMAINS = {
  webdev:   ["html","css","javascript","react","angular","vue","node","express","api","rest","frontend","backend","fullstack"],
  data:     ["python","sql","pandas","numpy","machine learning","data analysis","tableau","power bi","excel","statistics"],
  devops:   ["docker","kubernetes","aws","azure","gcp","ci/cd","jenkins","linux","bash","terraform","git"],
  mobile:   ["android","ios","flutter","react native","swift","kotlin","mobile"],
  security: ["cybersecurity","owasp","penetration","ethical hacking","firewall","network"],
  java:     ["java","spring","spring boot","hibernate","maven","microservices"],
  database: ["mongodb","mysql","postgresql","redis","sql","nosql","database"],
};

// ── Normalize text for comparison ─────────────────────────────────────────────
const norm = (s) => (s || "").toLowerCase().trim();

// ── 1. Skills Score ───────────────────────────────────────────────────────────
const scoreSkills = (resumeSkills = [], jobSkills = []) => {
  if (!jobSkills.length) return { score: 75, matched: [], missing: [] };
  const resumeNorm = resumeSkills.map(norm);
  const matched = jobSkills.filter((s) => resumeNorm.some((r) => r.includes(norm(s)) || norm(s).includes(r)));
  const missing = jobSkills.filter((s) => !matched.includes(s));
  const score   = Math.round((matched.length / jobSkills.length) * 100);
  return { score: Math.min(score, 100), matched, missing };
};

// ── 2. Keywords Score ─────────────────────────────────────────────────────────
const scoreKeywords = (rawText = "", jobTitle = "", jobDescription = "") => {
  const text      = norm(rawText);
  const jobText   = norm(jobTitle + " " + jobDescription);

  // Extract keywords from job text
  const allKeywords = Object.values(KEYWORD_DOMAINS).flat();
  const jobKeywords = allKeywords.filter((kw) => jobText.includes(kw));
  const uniqueJobKw = [...new Set(jobKeywords)];

  if (!uniqueJobKw.length) return { score: 70, found: [], total: 0 };

  const found = uniqueJobKw.filter((kw) => text.includes(kw));
  const score = Math.round((found.length / uniqueJobKw.length) * 100);
  return { score: Math.min(score, 100), found, total: uniqueJobKw.length };
};

// ── 3. Education Score ────────────────────────────────────────────────────────
const DEGREE_RANK = { "ph.d":5, "phd":5, "m.tech":4, "m.e":4, "master":4, "msc":4, "mba":3, "b.tech":3, "b.e":3, "bachelor":3, "bsc":3, "bca":2, "mca":4, "diploma":2 };

const scoreEducation = (parsedEducation = [], requiredEducation = "") => {
  if (!requiredEducation || requiredEducation.toLowerCase().includes("any")) {
    return { score: 80, detail: "No specific education requirement" };
  }
  if (!parsedEducation.length) return { score: 30, detail: "No education found in resume" };

  const reqLower = requiredEducation.toLowerCase();
  let reqRank = 0;
  for (const [kw, rank] of Object.entries(DEGREE_RANK)) {
    if (reqLower.includes(kw) && rank > reqRank) reqRank = rank;
  }

  let candRank = 0;
  let candDegree = "";
  for (const edu of parsedEducation) {
    const dl = (edu.degree || "").toLowerCase();
    for (const [kw, rank] of Object.entries(DEGREE_RANK)) {
      if (dl.includes(kw) && rank > candRank) { candRank = rank; candDegree = edu.degree; }
    }
  }

  if (!reqRank) return { score: 75, detail: "Education requirement unclear" };

  let score;
  if (candRank >= reqRank)      score = 100;
  else if (candRank === reqRank - 1) score = 70;
  else                               score = 40;

  return {
    score,
    detail: candDegree ? `${candDegree} detected` : "Education level below requirement",
  };
};

// ── 4. Experience Score ───────────────────────────────────────────────────────
const EXP_MONTHS = { "fresher": 0, "0-1 years": 6, "1-2 years": 18, "2+ years": 30 };

const scoreExperience = (parsedExperience = [], requiredLevel = "fresher") => {
  const reqMonths  = EXP_MONTHS[requiredLevel] ?? 0;
  const expCount   = parsedExperience.length;

  // Estimate months from experience entries
  let estMonths = expCount * 6; // rough estimate: 6 months per role if no dates

  let score;
  if (reqMonths === 0)             score = 100; // fresher role
  else if (estMonths >= reqMonths) score = 100;
  else if (estMonths > 0)          score = Math.round((estMonths / reqMonths) * 100);
  else                             score = 50;  // no experience but role needs some

  return {
    score: Math.min(score, 100),
    detail: expCount ? `${expCount} experience entr${expCount === 1 ? "y" : "ies"} found` : "No experience entries in resume",
  };
};

// ── Master ATS scorer ─────────────────────────────────────────────────────────
const calculateAtsScore = (resumeData, internship) => {
  const rawText     = resumeData?.rawText || "";
  const resumeSkills = [
    ...(resumeData?.parsedSkills    || []),
    ...(resumeData?.aiEnhancedSkills || []),
  ];
  const parsedEdu  = resumeData?.parsedEducation  || [];
  const parsedExp  = resumeData?.parsedExperience || [];
  const jobSkills  = [...(internship?.requiredSkills || []), ...(internship?.preferredSkills || [])];

  const skillsResult  = scoreSkills(resumeSkills, internship?.requiredSkills || []);
  const keywordsResult= scoreKeywords(rawText, internship?.title || "", internship?.description || "");
  const eduResult     = scoreEducation(parsedEdu, internship?.educationRequired || "");
  const expResult     = scoreExperience(parsedExp, internship?.experienceRequired || "fresher");

  const overall = Math.round(
    skillsResult.score  * WEIGHTS.skills  +
    keywordsResult.score * WEIGHTS.keywords +
    eduResult.score     * WEIGHTS.education +
    expResult.score     * WEIGHTS.experience
  );

  return {
    overall: Math.min(overall, 100),
    grade: overall >= 80 ? "Excellent" : overall >= 60 ? "Good" : overall >= 40 ? "Fair" : "Weak",
    breakdown: {
      skills:     { score: skillsResult.score,   weight: "40%", matched: skillsResult.matched,   missing: skillsResult.missing },
      keywords:   { score: keywordsResult.score, weight: "25%", found: keywordsResult.found,      total: keywordsResult.total },
      education:  { score: eduResult.score,      weight: "20%", detail: eduResult.detail },
      experience: { score: expResult.score,      weight: "15%", detail: expResult.detail },
    },
  };
};

// ── Gemini AI detailed analysis ───────────────────────────────────────────────
const generateAtsAnalysis = async (resumeData, internship, quickScore) => {
  try {
    const model = getGeminiModel();
    const skills  = [...(resumeData?.parsedSkills || []), ...(resumeData?.aiEnhancedSkills || [])].slice(0, 30).join(", ");
    const reqSkills = (internship?.requiredSkills || []).join(", ");

    const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job requirements.

Resume Skills: ${skills || "Not specified"}
Education: ${(resumeData?.parsedEducation || []).map(e => e.degree).join(", ") || "Not found"}
Experience entries: ${(resumeData?.parsedExperience || []).length}

Job Title: ${internship?.title || "Internship"}
Required Skills: ${reqSkills || "Not specified"}
Experience Required: ${internship?.experienceRequired || "fresher"}
Education Required: ${internship?.educationRequired || "Any"}

ATS Quick Score: ${quickScore}/100

Give a concise ATS analysis in exactly this JSON format (no markdown, no extra text):
{
  "summary": "2 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2"],
  "keywordTip": "one specific tip to improve keyword match"
}`;

    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    logger.warn("ATS AI analysis failed: " + err.message);
    return {
      summary: `Your resume scores ${quickScore}/100 on ATS screening. ${quickScore >= 60 ? "You are a strong candidate for this role." : "Consider adding more relevant skills and keywords."}`,
      strengths: ["Profile submitted successfully", "Resume parsed correctly"],
      improvements: ["Add more job-specific keywords", "Ensure all required skills are listed explicitly"],
      keywordTip: "Include the exact skill names from the job description in your resume.",
    };
  }
};

module.exports = { calculateAtsScore, generateAtsAnalysis };