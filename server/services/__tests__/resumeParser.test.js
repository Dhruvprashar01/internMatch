/**
 * services/__tests__/resumeParser.test.js
 * Unit tests for the resume parser engine
 * Run: cd server && npx jest resumeParser.test.js
 */

const {
  extractEmail,
  extractPhone,
  extractLinks,
  detectSections,
  extractName,
  extractSkills,
  extractEducation,
  extractExperience,
  extractProjects,
  scoreConfidence,
  cleanRawText,
  SKILL_TAXONOMY,
} = require("../resumeParser");

// ─── Sample resume text ───────────────────────────────────────────────────────
const SAMPLE_RESUME = `
Priya Sharma
priya.sharma@email.com | +91-9876543210 | linkedin.com/in/priyasharma | github.com/priyasharma

SUMMARY
Results-driven Software Engineer with 2 years of experience building scalable web applications using React and Node.js.

SKILLS
Python, JavaScript, React, Node.js, MongoDB, PostgreSQL, Docker, AWS, Git, REST API, Machine Learning, TensorFlow

EDUCATION
B.Tech in Computer Science
Indian Institute of Technology, Delhi
2018 – 2022 | CGPA: 8.5

EXPERIENCE
Software Engineer Intern
TechCorp Solutions, Mumbai
June 2021 – August 2021
• Developed REST APIs using Node.js and Express
• Built React components for the dashboard
• Optimized MongoDB queries reducing response time by 30%

PROJECTS
1. AI-Based Resume Parser
   Built a resume parsing system using Python and spaCy NLP library
   Tech: Python, spaCy, Flask, MongoDB

2. E-Commerce Platform
   Full-stack application with React frontend and Node.js backend
   Tech: React, Node.js, Express, MongoDB, Stripe

CERTIFICATIONS
• AWS Certified Cloud Practitioner – 2022
• Google Data Analytics – Coursera – 2021
`;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("cleanRawText", () => {
  test("normalizes whitespace", () => {
    const { cleanRawText } = require("../resumeParser");
    const input = "Hello   World\r\nTest\r\n\r\n\r\n\r\nFoo";
    const result = cleanRawText(input);
    expect(result).not.toContain("   ");
    expect(result).not.toContain("\r");
  });
});

describe("extractEmail", () => {
  test("extracts standard email", () => {
    expect(extractEmail(SAMPLE_RESUME)).toBe("priya.sharma@email.com");
  });
  test("returns null for no email", () => {
    expect(extractEmail("No email here")).toBeNull();
  });
  test("extracts email with plus sign", () => {
    expect(extractEmail("Contact: user+tag@domain.co")).toBe("user+tag@domain.co");
  });
});

describe("extractPhone", () => {
  test("extracts Indian mobile number", () => {
    const phone = extractPhone(SAMPLE_RESUME);
    expect(phone).toBeTruthy();
    expect(phone.replace(/\D/g, "").length).toBeGreaterThanOrEqual(10);
  });
  test("extracts US format phone", () => {
    const text = "Phone: (555) 123-4567";
    const phone = extractPhone(text);
    expect(phone).toBeTruthy();
  });
  test("returns null for no phone", () => {
    expect(extractPhone("No phone in this text")).toBeNull();
  });
});

describe("extractLinks", () => {
  test("extracts LinkedIn URL", () => {
    const links = extractLinks(SAMPLE_RESUME);
    expect(links.linkedIn).toContain("linkedin.com/in/priyasharma");
  });
  test("extracts GitHub URL", () => {
    const links = extractLinks(SAMPLE_RESUME);
    expect(links.github).toContain("github.com/priyasharma");
  });
  test("returns empty object for no links", () => {
    expect(extractLinks("No links here")).toEqual({});
  });
});

describe("detectSections", () => {
  test("detects major sections", () => {
    const sections = detectSections(SAMPLE_RESUME);
    expect(sections).toHaveProperty("skills");
    expect(sections).toHaveProperty("education");
    expect(sections).toHaveProperty("experience");
    expect(sections).toHaveProperty("projects");
  });
  test("skills section contains skill text", () => {
    const sections = detectSections(SAMPLE_RESUME);
    expect(sections.skills).toContain("Python");
  });
});

describe("extractName", () => {
  test("extracts name from header", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const name = extractName(SAMPLE_RESUME, sections);
    expect(name).toBe("Priya Sharma");
  });
  test("returns null for resume without clear name", () => {
    const noNameResume = "email@test.com\n1234567890\nSkills: Python";
    const sections = detectSections(noNameResume);
    const name = extractName(noNameResume, sections);
    expect(name).toBeNull();
  });
});

describe("extractSkills", () => {
  test("finds known technical skills", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const skills = extractSkills(SAMPLE_RESUME, sections);
    expect(skills).toContain("Python");
    expect(skills).toContain("React");
    expect(skills).toContain("MongoDB");
    expect(skills).toContain("Docker");
  });
  test("returns sorted array", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const skills = extractSkills(SAMPLE_RESUME, sections);
    const sorted = [...skills].sort();
    expect(skills).toEqual(sorted);
  });
  test("finds AI/ML skills", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const skills = extractSkills(SAMPLE_RESUME, sections);
    expect(skills).toContain("Machine Learning");
    expect(skills).toContain("TensorFlow");
  });
  test("SKILL_TAXONOMY is organized by category", () => {
    expect(SKILL_TAXONOMY).toHaveProperty("languages");
    expect(SKILL_TAXONOMY).toHaveProperty("frontend");
    expect(SKILL_TAXONOMY).toHaveProperty("aiml");
    expect(SKILL_TAXONOMY.languages).toContain("Python");
    expect(SKILL_TAXONOMY.frontend).toContain("React");
  });
});

describe("extractEducation", () => {
  test("finds B.Tech degree", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const education = extractEducation(SAMPLE_RESUME, sections);
    expect(education.length).toBeGreaterThan(0);
    const btech = education.find((e) => e.degree.includes("B.Tech"));
    expect(btech).toBeTruthy();
  });
  test("extracts graduation year", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const education = extractEducation(SAMPLE_RESUME, sections);
    const withYear = education.find((e) => e.endYear);
    expect(withYear?.endYear).toBe("2022");
  });
  test("extracts CGPA", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const education = extractEducation(SAMPLE_RESUME, sections);
    const withGrade = education.find((e) => e.grade);
    expect(withGrade?.grade).toContain("8.5");
  });
});

describe("extractExperience", () => {
  test("finds internship experience", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const experience = extractExperience(SAMPLE_RESUME, sections);
    expect(experience.length).toBeGreaterThan(0);
  });
  test("experience has role and company", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const experience = extractExperience(SAMPLE_RESUME, sections);
    const first = experience[0];
    expect(first).toHaveProperty("role");
    expect(first).toHaveProperty("company");
  });
});

describe("extractProjects", () => {
  test("finds numbered projects", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const projects = extractProjects(SAMPLE_RESUME, sections);
    expect(projects.length).toBeGreaterThan(0);
  });
  test("projects have title and technologies", () => {
    const sections = detectSections(SAMPLE_RESUME);
    const projects = extractProjects(SAMPLE_RESUME, sections);
    const first = projects[0];
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("technologies");
  });
});

describe("scoreConfidence", () => {
  test("high confidence for complete data", () => {
    const complete = {
      name: "John Doe",
      email: "john@test.com",
      phone: "+1234567890",
      skills: new Array(12).fill("Skill"),
      education: [{ degree: "B.Tech" }],
      experience: [{ role: "Engineer" }],
    };
    const score = scoreConfidence(complete, 3000);
    expect(score).toBeGreaterThan(0.8);
  });

  test("low confidence for sparse data", () => {
    const sparse = { name: null, email: null, phone: null, skills: [], education: [], experience: [] };
    const score = scoreConfidence(sparse, 100);
    expect(score).toBeLessThan(0.2);
  });

  test("confidence is between 0 and 1", () => {
    const data = { name: "Test", email: "t@t.com", phone: null, skills: ["JS"], education: [], experience: [] };
    const score = scoreConfidence(data, 500);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
