/**
 * services/geminiService.js — Google Gemini AI Integration
 * Used for:
 *   1. Enhancing skill extraction from resume text
 *   2. Generating human-readable match explanations
 */
const { getGeminiModel } = require("../config/gemini");
const { logger } = require("../middleware/logger");

/**
 * Enhance skill extraction using Gemini
 * @param {string} resumeText - Raw text from resume
 * @param {Array} alreadyFound - Skills already found by parser
 * @returns {Array} Enhanced skill list
 */
const enhanceSkillsWithAI = async (resumeText, alreadyFound = []) => {
  const model = getGeminiModel("gemini-pro");

  const prompt = `
You are an expert resume parser. Analyze the following resume text and extract ALL technical and professional skills.

Resume Text:
"""
${resumeText.slice(0, 3000)}
"""

Already found skills: ${alreadyFound.join(", ")}

Instructions:
- Extract ALL skills mentioned (programming languages, frameworks, tools, soft skills, methodologies)
- Include skills implied by project descriptions
- Return ONLY a JSON array of skill strings
- No explanations, no markdown, just the JSON array
- Example: ["Python", "React", "Agile", "Communication"]

Return the JSON array now:`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse the JSON array from the response
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) return alreadyFound;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return alreadyFound;

    return parsed.filter((s) => typeof s === "string" && s.length > 0);
  } catch (error) {
    logger.warn("Gemini skill enhancement failed: " + error.message);
    return alreadyFound;
  }
};

/**
 * Generate a human-readable explanation for a candidate-internship match
 * @param {Object} candidate - Candidate profile
 * @param {Object} internship - Internship document
 * @param {number} score - Match score (0-100)
 * @returns {string} Explanation text
 */
const generateMatchExplanation = async (candidate, internship, score) => {
  const model = getGeminiModel("gemini-pro");

  const candidateSkills = (candidate.skills || []).join(", ") || "Not specified";
  const requiredSkills = (internship.requiredSkills || []).join(", ") || "Not specified";
  const location = internship.location || "Not specified";
  const candidateLocations = (candidate.locationPreferences || []).join(", ") || "Flexible";
  const companyName = internship.company?.companyName || "the company";

  const prompt = `
You are an AI career advisor for an internship platform. Generate a personalized, encouraging match explanation.

Candidate Profile:
- Skills: ${candidateSkills}
- Experience Level: ${candidate.experienceLevel || "fresher"}
- Location Preferences: ${candidateLocations}
- Education: ${candidate.education?.map((e) => e.degree).join(", ") || "Not specified"}

Internship Details:
- Title: ${internship.title}
- Company: ${companyName}
- Required Skills: ${requiredSkills}
- Location: ${location}
- Experience Required: ${internship.experienceRequired || "fresher"}
- Match Score: ${Math.round(score)}%

Write a 2-3 sentence explanation of WHY this candidate matches this internship.
Be specific about matching skills and relevant factors.
Start with "You are recommended for this role because..."
Keep it professional, encouraging, and under 100 words.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    logger.warn("Gemini explanation generation failed: " + error.message);
    // Fallback explanation
    return `You are recommended for this role because your skill profile matches ${Math.round(score)}% of the requirements for ${internship.title} at ${companyName}.`;
  }
};

/**
 * Parse and improve a cover letter draft using Gemini
 * @param {string} draft - Raw cover letter from candidate
 * @param {Object} internship - Target internship
 * @returns {string} Improved cover letter
 */
const improveCoverLetter = async (draft, internship) => {
  const model = getGeminiModel("gemini-pro");

  const prompt = `
Improve the following cover letter for a ${internship.title} internship position.
Make it professional, concise, and compelling. Keep it under 200 words.

Original draft:
"${draft}"

Return only the improved cover letter text, no explanations.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    logger.warn("Cover letter improvement failed: " + error.message);
    return draft;
  }
};

module.exports = { enhanceSkillsWithAI, generateMatchExplanation, improveCoverLetter };
