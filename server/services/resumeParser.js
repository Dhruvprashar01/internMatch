/**
 * services/resumeParser.js — Production-Grade Resume Parsing Engine
 *
 * Architecture:
 *   1. File ingestion   → reads PDF/DOCX into raw text
 *   2. Section detector → splits text into labeled sections (Skills, Education, etc.)
 *   3. Field extractors → regex + heuristic extractors per field
 *   4. AI enhancer      → Gemini call to fill gaps (called from resumeController)
 *   5. Normalizer       → cleans, deduplicates, validates output
 *   6. Confidence scorer → rates overall parse quality 0–1
 *
 * Supported formats: PDF (.pdf), DOCX (.docx), DOC (.doc)
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Entry Point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main entry: parse a resume file into structured data
 *
 * @param {string} filePath  Absolute path to the uploaded file
 * @param {string} mimeType  MIME type of the file
 * @returns {Promise<ParsedResume>}
 */
const parseResume = async (filePath, mimeType) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileSize = fs.statSync(filePath).size;
  if (fileSize === 0) throw new Error("Uploaded file is empty");
  if (fileSize > 5 * 1024 * 1024) throw new Error("File exceeds 5MB limit");

  let rawText = "";
  let method = "manual";
  const parsingErrors = [];

  // ── Step 1: Extract raw text ────────────────────────────────────────────
  try {
    if (mimeType === "application/pdf") {
      rawText = await extractFromPDF(filePath);
      method = "pdf-parse";
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword" ||
      filePath.toLowerCase().endsWith(".docx") ||
      filePath.toLowerCase().endsWith(".doc")
    ) {
      rawText = await extractFromDOCX(filePath);
      method = "mammoth";
    } else {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
  } catch (err) {
    parsingErrors.push(`Text extraction failed: ${err.message}`);
    throw new Error(`Cannot read resume file: ${err.message}`);
  }

  if (!rawText || rawText.trim().length < 50) {
    parsingErrors.push("Extracted text is too short — resume may be image-based");
    throw new Error("Could not extract readable text. The PDF may be scanned/image-based.");
  }

  // ── Step 2: Detect sections ─────────────────────────────────────────────
  const sections = detectSections(rawText);

  // ── Step 3: Extract all fields ──────────────────────────────────────────
  const name     = extractName(rawText, sections);
  const email    = extractEmail(rawText);
  const phone    = extractPhone(rawText);
  const links    = extractLinks(rawText);
  const skills   = extractSkills(rawText, sections);
  const education   = extractEducation(rawText, sections);
  const experience  = extractExperience(rawText, sections);
  const projects    = extractProjects(rawText, sections);
  const summary     = extractSummary(rawText, sections);
  const certifications = extractCertifications(rawText, sections);
  const languages   = extractLanguages(rawText, sections);

  // ── Step 4: Confidence score ────────────────────────────────────────────
  const extracted = { name, email, phone, skills, education, experience, projects };
  const confidence = scoreConfidence(extracted, rawText.length);

  return {
    rawText,
    method,
    confidence,
    parsingErrors,
    // Contact
    name,
    email,
    phone,
    links,
    // Core sections
    skills,
    education,
    experience,
    projects,
    // Additional sections
    summary,
    certifications,
    languages,
    // Metadata
    sections: Object.keys(sections),
    wordCount: rawText.split(/\s+/).length,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — File Extractors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract text from PDF using pdf-parse
 * Falls back to buffer reading on stream issues
 */
const extractFromPDF = async (filePath) => {
  const pdfParse = require("pdf-parse");
  const dataBuffer = fs.readFileSync(filePath);

  // Custom render function to preserve line structure
  const options = {
    pagerender: (pageData) => {
      return pageData.getTextContent().then((textContent) => {
        let text = "";
        let lastY = null;
        for (const item of textContent.items) {
          if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
            text += "\n";
          }
          text += item.str + " ";
          lastY = item.transform[5];
        }
        return text;
      });
    },
  };

  try {
    const data = await pdfParse(dataBuffer, options);
    return cleanRawText(data.text);
  } catch (e) {
    // Fallback: try without custom renderer
    const data = await pdfParse(dataBuffer);
    return cleanRawText(data.text);
  }
};

/**
 * Extract text from DOCX using mammoth (replaces broken docx-parser package)
 */
const extractFromDOCX = async (filePath) => {
  const mammoth = require("mammoth");
  const result  = await mammoth.extractRawText({ path: filePath });
  if (!result.value || result.value.trim().length === 0) {
    throw new Error("DOCX parsing returned empty content");
  }
  return cleanRawText(result.value);
};

/**
 * Clean extracted raw text: normalize whitespace, remove junk chars
 */
const cleanRawText = (text) => {
  return text
    .replace(/\r\n/g, "\n")            // Normalize line endings
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")        // Collapse multiple spaces
    .replace(/\n{4,}/g, "\n\n\n")      // Max 3 blank lines
    .replace(/[^\x20-\x7E\n]/g, " ")   // Remove non-ASCII (but keep newlines)
    .trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Section Detector
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard resume section header patterns
 */
const SECTION_PATTERNS = {
  summary: /^(summary|profile|objective|about\s*me|professional\s*summary|career\s*objective)/im,
  skills: /^(skills|technical\s*skills|core\s*competencies|technologies|tech\s*stack|expertise|key\s*skills)/im,
  experience: /^(experience|work\s*experience|employment|professional\s*experience|work\s*history|internship|internships)/im,
  education: /^(education|academic|qualification|qualifications|academics)/im,
  projects: /^(projects|personal\s*projects|academic\s*projects|key\s*projects|portfolio)/im,
  certifications: /^(certifications?|certificates?|courses?|training|licenses?|achievements?|awards?)/im,
  languages: /^(languages?|spoken\s*languages?|language\s*proficiency)/im,
  contact: /^(contact|contact\s*information|personal\s*information)/im,
};

/**
 * Detect and split resume into named sections
 * @param {string} text Raw resume text
 * @returns {Object} { sectionName: sectionText }
 */
const detectSections = (text) => {
  const lines = text.split("\n");
  const sections = {};
  let currentSection = "header";
  let currentLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    let matched = false;

    for (const [sectionName, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(trimmed) && trimmed.length < 60) {
        // Save previous section
        if (currentLines.length > 0) {
          sections[currentSection] = (sections[currentSection] || "") + "\n" + currentLines.join("\n");
        }
        currentSection = sectionName;
        currentLines = [];
        matched = true;
        break;
      }
    }

    if (!matched) {
      currentLines.push(line);
    }
  }

  // Save last section
  if (currentLines.length > 0) {
    sections[currentSection] = (sections[currentSection] || "") + "\n" + currentLines.join("\n");
  }

  return sections;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Field Extractors
// ─────────────────────────────────────────────────────────────────────────────

// ── 4.1 NAME ─────────────────────────────────────────────────────────────────

const extractName = (text, sections) => {
  // Strategy 1: header section — first non-empty line that looks like a name
  const headerText = sections.header || sections.contact || "";
  const headerLines = headerText.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of headerLines.slice(0, 6)) {
    const name = tryParseName(line);
    if (name) return name;
  }

  // Strategy 2: first few lines of raw text
  const allLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of allLines.slice(0, 8)) {
    const name = tryParseName(line);
    if (name) return name;
  }

  return null;
};

const tryParseName = (line) => {
  // Rules: 2-5 words, each capitalized, no digits, no special chars, not a section header
  if (line.length < 3 || line.length > 60) return null;
  if (/\d/.test(line)) return null;
  if (line.includes("@")) return null;
  if (/[|•:,;]/.test(line)) return null;

  const words = line.trim().split(/\s+/);
  if (words.length < 1 || words.length > 5) return null;

  const allCapitalized = words.every((w) => /^[A-Z][a-zA-Z'-]+$/.test(w));
  if (!allCapitalized) return null;

  // Reject common section header words
  const headerWords = ["summary", "skills", "education", "experience", "projects", "contact", "profile", "resume", "cv"];
  if (headerWords.includes(line.toLowerCase())) return null;

  return line;
};

// ── 4.2 EMAIL ─────────────────────────────────────────────────────────────────

const extractEmail = (text) => {
  const matches = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g);
  if (!matches) return null;

  // Prefer personal emails over institutional ones
  const personal = matches.find((m) => !m.includes("university") && !m.includes("edu.ac"));
  return personal || matches[0];
};

// ── 4.3 PHONE ─────────────────────────────────────────────────────────────────

const extractPhone = (text) => {
  const patterns = [
    /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,  // US format
    /(\+91[\s-]?)?\d{5}[\s-]?\d{5}/,                         // India mobile
    /(\+\d{1,3}[\s-]?)?\d{10}/,                              // Generic 10-digit
    /(\+\d{1,3}[\s-]?)?\d{3}[\s-]\d{3}[\s-]\d{4}/,          // Dashed format
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[0].replace(/\s+/g, "").replace(/[()]/g, "");
      if (cleaned.replace(/\D/g, "").length >= 10) return cleaned;
    }
  }
  return null;
};

// ── 4.4 LINKS ─────────────────────────────────────────────────────────────────

const extractLinks = (text) => {
  const links = {};

  const linkedInMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9_\-]+)/i);
  if (linkedInMatch) links.linkedIn = `https://linkedin.com/in/${linkedInMatch[1]}`;

  const githubMatch = text.match(/github\.com\/([a-zA-Z0-9_\-]+)/i);
  if (githubMatch) links.github = `https://github.com/${githubMatch[1]}`;

  const portfolioMatch = text.match(/https?:\/\/(?!linkedin|github)[^\s<>"]+\.[a-zA-Z]{2,}[^\s<>"]{0,50}/i);
  if (portfolioMatch) links.portfolio = portfolioMatch[0];

  return links;
};

// ── 4.5 SKILLS ───────────────────────────────────────────────────────────────

/**
 * Comprehensive skill taxonomy — 200+ technologies
 */
const SKILL_TAXONOMY = {
  languages: [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C", "Go", "Rust",
    "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl", "Haskell",
    "Lua", "Dart", "Groovy", "Julia", "Elixir", "Clojure", "F#", "COBOL",
    "Fortran", "Assembly", "Shell", "Bash", "PowerShell", "VBA",
  ],
  frontend: [
    "React", "Angular", "Vue", "Vue.js", "Svelte", "Next.js", "Nuxt.js", "Gatsby",
    "Redux", "MobX", "Zustand", "Tailwind CSS", "Bootstrap", "Material UI",
    "Ant Design", "Chakra UI", "SASS", "SCSS", "LESS", "Webpack", "Vite",
    "Babel", "jQuery", "HTML", "HTML5", "CSS", "CSS3", "Responsive Design",
    "PWA", "WebSocket", "GraphQL", "Apollo",
  ],
  backend: [
    "Node.js", "Express", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot",
    "Spring", "Laravel", "Ruby on Rails", "Rails", "ASP.NET", ".NET Core",
    "NestJS", "Koa", "Hapi", "Fastify", "Gin", "Echo", "Fiber",
    "REST API", "RESTful API", "gRPC", "WebSockets", "Microservices",
  ],
  databases: [
    "MongoDB", "MySQL", "PostgreSQL", "SQLite", "Oracle", "SQL Server", "MSSQL",
    "Redis", "Cassandra", "DynamoDB", "Elasticsearch", "Firebase", "Firestore",
    "Supabase", "CockroachDB", "MariaDB", "Neo4j", "InfluxDB", "Couchbase",
    "SQL", "NoSQL", "GraphQL", "ORM", "Mongoose", "Sequelize", "Prisma", "TypeORM",
  ],
  cloud: [
    "AWS", "Azure", "GCP", "Google Cloud", "Heroku", "DigitalOcean", "Vercel",
    "Netlify", "Cloudflare", "EC2", "S3", "Lambda", "RDS", "ECS", "EKS",
    "Cloud Functions", "App Engine", "Cloud Run",
  ],
  devops: [
    "Docker", "Kubernetes", "Terraform", "Ansible", "Puppet", "Chef",
    "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Travis CI",
    "CI/CD", "DevOps", "Nginx", "Apache", "Load Balancing",
    "Prometheus", "Grafana", "ELK Stack", "Splunk",
  ],
  aiml: [
    "Machine Learning", "Deep Learning", "Neural Networks", "NLP",
    "Computer Vision", "Reinforcement Learning", "Data Science",
    "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "sklearn",
    "OpenCV", "NLTK", "spaCy", "Transformers", "Hugging Face",
    "LangChain", "LLM", "RAG", "BERT", "GPT", "Stable Diffusion",
    "Pandas", "NumPy", "Matplotlib", "Seaborn", "SciPy", "Statsmodels",
  ],
  data: [
    "Data Analysis", "Data Engineering", "ETL", "Data Pipeline",
    "Apache Spark", "Hadoop", "Kafka", "Airflow", "DBT",
    "Tableau", "Power BI", "Looker", "Metabase",
    "A/B Testing", "Statistics", "Data Visualization",
  ],
  mobile: [
    "Android", "iOS", "React Native", "Flutter", "Xamarin", "Ionic",
    "Swift UI", "Jetpack Compose", "Expo",
  ],
  tools: [
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence",
    "Postman", "Insomnia", "Figma", "Sketch", "Adobe XD",
    "VS Code", "IntelliJ", "Eclipse", "Vim", "Neovim",
    "Linux", "Unix", "macOS", "Windows", "WSL",
    "Agile", "Scrum", "Kanban", "SAFe", "SDLC",
  ],
  security: [
    "Cybersecurity", "OWASP", "Penetration Testing", "Ethical Hacking",
    "OAuth", "JWT", "SSL/TLS", "Cryptography", "Firewalls",
    "Network Security", "SIEM", "SOC",
  ],
  blockchain: [
    "Blockchain", "Ethereum", "Solidity", "Web3.js", "Smart Contracts",
    "NFT", "DeFi", "Hyperledger",
  ],
};

// Flatten taxonomy for matching
const ALL_SKILLS_FLAT = Object.values(SKILL_TAXONOMY).flat();

const extractSkills = (text, sections) => {
  const foundSkills = new Set();
  const textLower = text.toLowerCase();

  // Search entire document for all known skills
  for (const skill of ALL_SKILLS_FLAT) {
    const skillLower = skill.toLowerCase();
    // Use word boundary check to avoid partial matches
    const pattern = new RegExp(`(?<![a-zA-Z0-9_])${escapeRegex(skillLower)}(?![a-zA-Z0-9_])`, "i");
    if (pattern.test(textLower)) {
      foundSkills.add(skill);
    }
  }

  // Also parse skills section for comma/bullet-delimited lists
  const skillsSectionText = sections.skills || "";
  if (skillsSectionText) {
    const tokens = skillsSectionText
      .split(/[,•|\n\t]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 50);

    for (const token of tokens) {
      // Add tokens that look like technology names (PascalCase or all-caps or known)
      if (/^[A-Z][a-zA-Z0-9.#+\-]+$/.test(token) || /^[A-Z]{2,}$/.test(token)) {
        foundSkills.add(token);
      }
    }
  }

  return [...foundSkills].sort();
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── 4.6 EDUCATION ─────────────────────────────────────────────────────────────

const DEGREE_PATTERNS = [
  { pattern: /\b(b\.?tech|b\.?e\.?|bachelor of (technology|engineering))\b/i, label: "B.Tech / B.E." },
  { pattern: /\b(m\.?tech|m\.?e\.?|master of (technology|engineering))\b/i, label: "M.Tech / M.E." },
  { pattern: /\b(b\.?sc|bachelor of science)\b/i, label: "B.Sc" },
  { pattern: /\b(m\.?sc|master of science)\b/i, label: "M.Sc" },
  { pattern: /\b(b\.?com|bachelor of commerce)\b/i, label: "B.Com" },
  { pattern: /\b(b\.?a\.?|bachelor of arts)\b/i, label: "B.A." },
  { pattern: /\b(m\.?b\.?a|master of business)\b/i, label: "MBA" },
  { pattern: /\b(ph\.?d|doctor of philosophy)\b/i, label: "Ph.D." },
  { pattern: /\b(diploma)\b/i, label: "Diploma" },
  { pattern: /\b(10th|ssc|matriculation|secondary)\b/i, label: "10th (SSC)" },
  { pattern: /\b(12th|hsc|intermediate|higher secondary)\b/i, label: "12th (HSC)" },
];

const INSTITUTION_PATTERNS = /\b(university|college|institute|iit|nit|bits|school|academy|polytechnic)\b/i;

const YEAR_PATTERN = /(20\d{2}|19\d{2})/g;
const GRADE_PATTERN = /(\d+\.?\d*\s*(cgpa|gpa|%|percent|grade|score))/i;

const extractEducation = (text, sections) => {
  const searchText = sections.education || text;
  const lines = searchText.split("\n").map((l) => l.trim()).filter(Boolean);
  const education = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // Check if line contains a degree keyword
    const degreeMatch = DEGREE_PATTERNS.find((d) => d.pattern.test(line));
    const isInstitution = INSTITUTION_PATTERNS.test(line);

    if (degreeMatch || isInstitution) {
      const years = line.match(YEAR_PATTERN);
      const gradeMatch = line.match(GRADE_PATTERN);

      // Look ahead for institution name if current line is degree
      let institution = "";
      let degree = degreeMatch ? degreeMatch.label : "";
      let field = "";

      if (degreeMatch && !isInstitution && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (INSTITUTION_PATTERNS.test(nextLine)) {
          institution = nextLine;
          i++;
        }
      } else if (isInstitution) {
        institution = line;
        // Look back for degree
        if (i > 0) {
          const prevLine = lines[i - 1];
          const prevDegree = DEGREE_PATTERNS.find((d) => d.pattern.test(prevLine));
          if (prevDegree) degree = prevDegree.label;
        }
      }

      // Extract field of study from line
      const fieldMatch = line.match(/\b(computer\s*science|information\s*technology|electronics|electrical|mechanical|civil|biotechnology|mathematics|physics|chemistry|commerce|arts|business)\b/i);
      if (fieldMatch) field = fieldMatch[0];

      education.push({
        institution: institution || line,
        degree,
        field,
        startYear: years ? years[0] : null,
        endYear: years ? years[years.length - 1] : null,
        grade: gradeMatch ? gradeMatch[0] : null,
      });
    }
    i++;
  }

  // Deduplicate and limit
  const seen = new Set();
  return education.filter((e) => {
    const key = `${e.institution}-${e.degree}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
};

// ── 4.7 EXPERIENCE ─────────────────────────────────────────────────────────────

const JOB_TITLE_PATTERNS = [
  /\b(software|web|mobile|backend|frontend|full.?stack|data|machine learning|ai|ml|cloud|devops|security|qa|test)\s+(engineer|developer|architect|analyst|scientist|intern|lead|manager)\b/i,
  /\b(intern|internship|trainee|apprentice)\b/i,
  /\b(junior|senior|lead|principal|staff|associate)\s+[a-z]+\b/i,
  /\b(developer|engineer|programmer|analyst|consultant|designer|manager|director|head)\b/i,
];

const DATE_RANGE_PATTERN = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,.]*(\d{4})\s*[-–—to]+\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current)[a-z]*[\s,.]*(\d{4})?/i;
const SIMPLE_DATE_PATTERN = /(20\d{2})\s*[-–—to]+\s*(20\d{2}|present|current)/i;

const extractExperience = (text, sections) => {
  const searchText = sections.experience || text;
  const lines = searchText.split("\n").map((l) => l.trim()).filter(Boolean);
  const experiences = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if line looks like a job title
    const isJobTitle = JOB_TITLE_PATTERNS.some((p) => p.test(line));
    const dateMatch = line.match(DATE_RANGE_PATTERN) || line.match(SIMPLE_DATE_PATTERN);

    if (isJobTitle || dateMatch) {
      const entry = {
        role: line,
        company: "",
        duration: "",
        startDate: null,
        endDate: null,
        description: "",
        responsibilities: [],
      };

      // Parse duration from current or next lines
      if (dateMatch) {
        entry.duration = dateMatch[0];
      }

      // Look ahead for company name and description
      const descLines = [];
      let j = i + 1;
      while (j < lines.length && j < i + 8) {
        const nextLine = lines[j];
        if (JOB_TITLE_PATTERNS.some((p) => p.test(nextLine)) && j > i + 1) break;
        if (!entry.company && nextLine.length > 2 && nextLine.length < 80) {
          // First non-empty line after title = likely company
          if (!DATE_RANGE_PATTERN.test(nextLine) && !SIMPLE_DATE_PATTERN.test(nextLine)) {
            entry.company = nextLine;
          } else {
            entry.duration = nextLine;
          }
        } else if (nextLine.startsWith("•") || nextLine.startsWith("-") || nextLine.startsWith("*")) {
          entry.responsibilities.push(nextLine.replace(/^[•\-*]\s*/, ""));
        } else {
          descLines.push(nextLine);
        }
        j++;
      }

      entry.description = descLines.join(" ").slice(0, 300);
      experiences.push(entry);
      i = j;
    } else {
      i++;
    }
  }

  return experiences.slice(0, 6);
};

// ── 4.8 PROJECTS ─────────────────────────────────────────────────────────────

const PROJECT_TRIGGER_PATTERNS = [
  /^project\s*\d*\s*[:—-]?\s*/i,
  /^\d+\.\s+[A-Z]/,
  /^[•\-*]\s*[A-Z]/,
];

const extractProjects = (text, sections) => {
  const searchText = sections.projects || "";
  if (!searchText) return extractProjectsFromFullText(text);

  const lines = searchText.split("\n").map((l) => l.trim()).filter(Boolean);
  const projects = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const isTrigger = PROJECT_TRIGGER_PATTERNS.some((p) => p.test(line)) || (line.length > 5 && line.length < 80 && /^[A-Z]/.test(line));

    if (isTrigger) {
      const project = {
        title: line.replace(/^(\d+\.?\s*|[•\-*]\s*)/, ""),
        description: "",
        technologies: [],
        link: null,
      };

      // Collect following lines as description
      const descLines = [];
      let j = i + 1;
      while (j < lines.length && j < i + 6) {
        const next = lines[j];
        if (PROJECT_TRIGGER_PATTERNS.some((p) => p.test(next)) && j > i + 1) break;

        // Extract technologies mentioned in parentheses or after "Tech:"
        const techMatch = next.match(/(?:tech(?:nologies)?|built with|stack|tools)[:—-]?\s*(.+)/i);
        if (techMatch) {
          project.technologies = techMatch[1].split(/[,|]/).map((t) => t.trim()).filter(Boolean);
        }

        const linkMatch = next.match(/https?:\/\/[^\s]+/);
        if (linkMatch) project.link = linkMatch[0];

        descLines.push(next);
        j++;
      }

      project.description = descLines.join(" ").slice(0, 400);

      // Extract technologies from description if not found explicitly
      if (project.technologies.length === 0) {
        project.technologies = extractSkillsFromText(project.title + " " + project.description);
      }

      projects.push(project);
      i = j;
    } else {
      i++;
    }
  }

  return projects.slice(0, 6);
};

const extractProjectsFromFullText = (text) => {
  // Fallback: look for project-like lines in full text
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const projects = [];
  const projectKeywords = /\b(project|developed|built|created|implemented|designed)\b/i;

  for (let i = 0; i < lines.length && projects.length < 4; i++) {
    if (projectKeywords.test(lines[i]) && lines[i].length > 20) {
      projects.push({
        title: lines[i].slice(0, 80),
        description: (lines[i + 1] || "").slice(0, 200),
        technologies: extractSkillsFromText(lines[i]),
        link: null,
      });
    }
  }

  return projects;
};

// Quick skill extractor for a snippet of text
const extractSkillsFromText = (text) => {
  const found = [];
  for (const skill of ALL_SKILLS_FLAT) {
    if (new RegExp(`\\b${escapeRegex(skill)}\\b`, "i").test(text)) {
      found.push(skill);
    }
  }
  return found.slice(0, 8);
};

// ── 4.9 SUMMARY ──────────────────────────────────────────────────────────────

const extractSummary = (text, sections) => {
  const raw = sections.summary || sections.profile || sections.objective || "";
  if (raw) return raw.trim().slice(0, 500);

  // Fallback: first substantive paragraph
  const paragraphs = text.split(/\n{2,}/);
  for (const para of paragraphs.slice(0, 3)) {
    const trimmed = para.trim();
    if (trimmed.length > 50 && trimmed.length < 600 && !SECTION_PATTERNS.skills.test(trimmed)) {
      return trimmed;
    }
  }

  return null;
};

// ── 4.10 CERTIFICATIONS ────────────────────────────────────────────────────────

const CERT_PROVIDERS = /\b(aws|azure|gcp|google|microsoft|oracle|cisco|comptia|coursera|udemy|edx|nptel|infosys|tcs|hcl)\b/i;

const extractCertifications = (text, sections) => {
  const searchText = sections.certifications || sections.achievements || "";
  if (!searchText) return [];

  const lines = searchText.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines
    .filter((l) => l.length > 5 && l.length < 200)
    .map((l) => {
      const yearMatch = l.match(/20\d{2}/);
      const providerMatch = l.match(CERT_PROVIDERS);
      return {
        name: l.replace(/^[•\-*\d.]\s*/, ""),
        year: yearMatch ? yearMatch[0] : null,
        provider: providerMatch ? providerMatch[0] : null,
      };
    })
    .slice(0, 8);
};

// ── 4.11 LANGUAGES ────────────────────────────────────────────────────────────

const KNOWN_LANGUAGES = [
  "English", "Hindi", "Spanish", "French", "German", "Chinese", "Japanese",
  "Arabic", "Portuguese", "Russian", "Korean", "Italian", "Tamil", "Telugu",
  "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi",
];

const extractLanguages = (text, sections) => {
  const searchText = sections.languages || text;
  return KNOWN_LANGUAGES.filter((lang) => new RegExp(`\\b${lang}\\b`, "i").test(searchText));
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Confidence Scorer
// ─────────────────────────────────────────────────────────────────────────────

const scoreConfidence = (extracted, textLength) => {
  let score = 0;

  if (extracted.name)                          score += 0.15;
  if (extracted.email)                         score += 0.20;
  if (extracted.phone)                         score += 0.10;
  if (extracted.skills && extracted.skills.length >= 3)  score += 0.25;
  if (extracted.skills && extracted.skills.length >= 10) score += 0.05;
  if (extracted.education && extracted.education.length > 0) score += 0.15;
  if (extracted.experience && extracted.experience.length > 0) score += 0.10;
  if (textLength > 500)                        score += 0.05; // Has enough content
  if (textLength > 2000)                       score += 0.05; // Detailed resume

  return Math.min(parseFloat(score.toFixed(2)), 1.0);
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  parseResume,
  // Exported individually for testing
  extractFromPDF,
  extractFromDOCX,
  detectSections,
  extractName,
  extractEmail,
  extractPhone,
  extractLinks,
  extractSkills,
  extractEducation,
  extractExperience,
  extractProjects,
  extractSummary,
  extractCertifications,
  extractLanguages,
  scoreConfidence,
  cleanRawText,
  SKILL_TAXONOMY,
};