/**
 * services/roadmapService.js — Internship Readiness Roadmap Generator
 *
 * Generates a personalized week-by-week learning plan using Gemini AI
 * to help a candidate close the skill gap for a specific internship.
 */
"use strict";

const { getGeminiModel } = require("../config/gemini");
const { logger }         = require("../middleware/logger");

/**
 * Generate a readiness roadmap for a candidate targeting a specific internship
 *
 * @param {Object} candidate   - Candidate profile (plain object)
 * @param {Object} internship  - Internship document (plain object)
 * @param {number} matchScore  - Current match score 0-100
 * @returns {Object} roadmap
 */
const generateRoadmap = async (candidate, internship, matchScore) => {
  const model = getGeminiModel();

  const candidateSkills  = (candidate.skills || []).join(", ") || "None listed";
  const requiredSkills   = (internship.requiredSkills  || []).join(", ") || "Not specified";
  const preferredSkills  = (internship.preferredSkills || []).join(", ") || "None";
  const experienceLevel  = candidate.experienceLevel   || "fresher";
  const education        = (candidate.education || []).map((e) => e.degree).join(", ") || "Not specified";
  const internshipTitle  = internship.title            || "Internship";
  const companyName      = internship.company?.companyName || "the company";
  const duration         = internship.duration         || "a few months";

  // Calculate missing skills
  const candidateNorm = (candidate.skills || []).map((s) => s.toLowerCase().trim());
  const missingSkills = (internship.requiredSkills || [])
    .filter((s) => !candidateNorm.some((c) => c.includes(s.toLowerCase()) || s.toLowerCase().includes(c)))
    .slice(0, 8);

  const targetScore    = Math.min(matchScore + 20, 95);
  const weeksNeeded    = missingSkills.length <= 2 ? 2 : missingSkills.length <= 4 ? 3 : 4;

  const prompt = `You are an expert career coach for tech internships. Create a personalized readiness roadmap.

CANDIDATE PROFILE:
- Current Skills: ${candidateSkills}
- Experience Level: ${experienceLevel}
- Education: ${education}
- Current Match Score: ${Math.round(matchScore)}%

TARGET INTERNSHIP:
- Title: ${internshipTitle}
- Company: ${companyName}
- Duration: ${duration}
- Required Skills: ${requiredSkills}
- Preferred Skills: ${preferredSkills}
- Missing Skills: ${missingSkills.join(", ") || "None — strong match already"}

Generate a ${weeksNeeded}-week personalized learning roadmap to improve their match from ${Math.round(matchScore)}% to ${targetScore}%+.

Return ONLY valid JSON (no markdown, no extra text):
{
  "currentScore": ${Math.round(matchScore)},
  "targetScore": ${targetScore},
  "weeksNeeded": ${weeksNeeded},
  "readinessLevel": "one of: Beginner | Developing | Nearly Ready | Job Ready",
  "summary": "2 sentence personalized summary of their situation and what this plan will achieve",
  "missingSkills": ${JSON.stringify(missingSkills)},
  "weeks": [
    {
      "week": 1,
      "theme": "short theme name e.g. Core Foundations",
      "goal": "what they will achieve this week",
      "tasks": [
        {
          "title": "task name",
          "type": "one of: video | article | project | practice | course",
          "duration": "e.g. 2 hours",
          "description": "what to do and why it helps",
          "resource": "specific free resource name e.g. freeCodeCamp React Tutorial, MDN Docs, official docs",
          "resourceUrl": "real URL if you know it, else empty string"
        }
      ],
      "milestone": "what they can show/demo at end of week"
    }
  ],
  "finalTips": ["tip 1", "tip 2", "tip 3"],
  "githubProjectIdea": "one specific mini-project idea to build and add to GitHub that demonstrates the key skills"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim()
      .replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(text);

    // Validate structure
    if (!parsed.weeks || !Array.isArray(parsed.weeks)) {
      throw new Error("Invalid roadmap structure from AI");
    }

    return parsed;
  } catch (err) {
    logger.warn("Roadmap generation failed: " + err.message);
    // Return a meaningful fallback
    return generateFallbackRoadmap(candidate, internship, matchScore, missingSkills, targetScore, weeksNeeded);
  }
};

// Fallback if Gemini fails
const generateFallbackRoadmap = (candidate, internship, matchScore, missingSkills, targetScore, weeksNeeded) => {
  const weeks = missingSkills.slice(0, weeksNeeded).map((skill, i) => ({
    week: i + 1,
    theme: `Master ${skill}`,
    goal: `Build confidence and hands-on experience with ${skill}`,
    tasks: [
      {
        title: `Learn ${skill} fundamentals`,
        type: "course",
        duration: "3-4 hours",
        description: `Study the core concepts of ${skill} through official documentation or a beginner tutorial.`,
        resource: `${skill} Official Documentation`,
        resourceUrl: "",
      },
      {
        title: `Build a mini project using ${skill}`,
        type: "project",
        duration: "2-3 hours",
        description: `Apply what you learned by building a small working project.`,
        resource: "GitHub",
        resourceUrl: "https://github.com",
      },
    ],
    milestone: `Can explain and demonstrate ${skill} with a working example`,
  }));

  return {
    currentScore:   Math.round(matchScore),
    targetScore,
    weeksNeeded,
    readinessLevel: matchScore >= 70 ? "Nearly Ready" : matchScore >= 50 ? "Developing" : "Beginner",
    summary:        `You currently match ${Math.round(matchScore)}% of the requirements for ${internship.title}. This ${weeksNeeded}-week plan focuses on closing the skill gaps to get you to ${targetScore}%+.`,
    missingSkills,
    weeks,
    finalTips: [
      "Push all practice projects to GitHub — employers check your activity",
      "Update your resume on this platform after completing each week",
      "Apply even before finishing — learning and applying in parallel works well",
    ],
    githubProjectIdea: `Build a mini ${internship.title.split(" ")[0]} project using ${(internship.requiredSkills || []).slice(0, 3).join(", ")} and deploy it online.`,
  };
};

module.exports = { generateRoadmap };