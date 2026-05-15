# InternMatch AI — Smart Allocation Engine for Internship Matching
[![CI/CD Status](https://img.shields.io/badge/CI%2FCD-Automated-green)](http://localhost:8080)

> A full-stack MERN platform that uses **Google Gemini AI** and a **multi-dimensional matching engine** to intelligently connect candidates with internship opportunities.

---

## ✦ Project Overview

InternMatch AI is a production-grade internship platform built like LinkedIn or Naukri, powered by:

- **Gemini AI** — generates natural-language match explanations and enhances resume skill extraction
- **5-factor Matching Engine** — scores candidate–internship pairs across skill, education, experience, location, and availability
- **AI Resume Parser** — extracts skills, education, experience, projects, and certifications from PDF/DOCX resumes
- **Fairness-aware Re-ranking** — transparent diversity boosts for underrepresented candidates (SC/ST/OBC/PWD/EWS)
- **3-role Auth system** — separate dashboards for Candidates, Companies, and Admins

---

## 🗂 Project Structure

```
internship-ai-platform/
├── package.json              # Root — runs both client + server
├── .env.example              # Root env template
├── README.md
│
├── client/                   # React frontend (Create React App)
│   ├── package.json
│   └── src/
│       ├── App.js            # Route definitions (React Router v6)
│       ├── index.js
│       ├── index.css         # Global CSS variables & design tokens
│       ├── context/
│       │   ├── AuthContext.js        # JWT auth state
│       │   └── ThemeContext.js
│       ├── hooks/
│       │   ├── useAuth.js            # Auth hook
│       │   ├── useDebounce.js
│       │   ├── useFetch.js           # Generic API fetch hook
│       │   └── useForm.js
│       ├── services/
│       │   ├── api.js                # Axios instance + interceptors
│       │   ├── authService.js
│       │   ├── candidateService.js   # Resume upload, profile, recommendations
│       │   ├── companyService.js
│       │   ├── internshipService.js
│       │   ├── applicationService.js
│       │   ├── adminService.js
│       │   └── recommendationService.js
│       ├── utils/
│       │   ├── constants.js          # Roles, statuses, enums
│       │   ├── formatters.js         # Date, currency, truncate
│       │   ├── helpers.js
│       │   └── validators.js
│       ├── components/
│       │   ├── common/       Button, Card, Badge, Alert, Spinner, Modal, Pagination,
│       │   │                 SearchBar, SkillTags, FileUpload
│       │   ├── layout/       DashboardLayout (sidebar+topbar), Navbar, Footer, PublicLayout
│       │   ├── auth/         LoginForm, RegisterForm, ProtectedRoute, RoleRoute
│       │   ├── candidate/    InternshipCard, RecommendationCard, ApplicationCard,
│       │   │                 ProfileForm, ResumeUpload, SkillEditor
│       │   ├── company/      InternshipForm, CandidateCard, CompanyProfileForm,
│       │   │                 ApplicationManager, MatchedCandidates
│       │   └── admin/        StatsOverview, AnalyticsCard, DiversityChart, UserTable
│       └── pages/
│           ├── auth/         Login, Register
│           ├── candidate/    CandidateDashboard, CandidateProfile, Recommendations,
│           │                 MyApplications, InternshipDetails
│           ├── company/      CompanyDashboard, CompanyProfile, PostInternship,
│           │                 ManageInternships, ViewApplicants
│           └── admin/        AdminDashboard, ManageUsers, DiversityReport, PlatformStats
│
└── server/                   # Node.js + Express backend
    ├── server.js             # App entry point
    ├── package.json
    ├── .env                  # (you create this from .env.example)
    ├── config/
    │   ├── db.js             # MongoDB Atlas connection
    │   ├── gemini.js         # Gemini AI client singleton
    │   └── multer.js         # File upload config (PDF/DOCX, 5MB)
    ├── models/
    │   ├── User.js           # Auth model (bcrypt, JWT)
    │   ├── Candidate.js      # Full profile with Education/Experience sub-schemas
    │   ├── Company.js
    │   ├── Internship.js     # Text-indexed posting model
    │   ├── Application.js    # Unique candidate+internship index
    │   └── ResumeData.js     # Stores raw text + all parsed fields
    ├── controllers/
    │   ├── authController.js
    │   ├── candidateController.js
    │   ├── companyController.js
    │   ├── internshipController.js
    │   ├── applicationController.js
    │   ├── recommendationController.js
    │   ├── resumeController.js
    │   └── adminController.js
    ├── routes/               # All 8 route namespaces
    ├── middleware/
    │   ├── auth.js           # JWT protect + generateToken
    │   ├── roleCheck.js      # authorize(...roles) factory
    │   ├── errorHandler.js   # AppError class + global handler
    │   ├── rateLimiter.js    # global / auth / AI rate limits
    │   ├── logger.js         # Winston logger
    │   └── validate.js       # express-validator result checker
    ├── services/
    │   ├── matchingEngine.js   # 6-dimension weighted scorer + recommender
    │   ├── fairnessService.js  # Diversity boost + quota guard + Shannon entropy
    │   ├── resumeParser.js     # PDF+DOCX → 11 field extractors (810 lines)
    │   └── geminiService.js    # Gemini AI integration (skills + explanations)
    └── utils/
        ├── constants.js      # WEIGHTS, FAIRNESS_BOOST, enums
        ├── helpers.js        # Jaccard, pagination, sort helpers
        ├── validators.js     # express-validator rule sets
        └── responseHandler.js
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone and install

```bash
git clone https://github.com/yourname/internmatch-ai.git
cd internmatch-ai

# Install all dependencies (root + client + server)
npm run install-all
```

### 2. Configure environment variables

```bash
# Create server/.env from the template
cp .env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/internmatch
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=AIzaSy...your-gemini-key...
CLIENT_URL=http://localhost:3000
```

### 3. Create upload and log directories

```bash
mkdir -p server/uploads server/logs
touch server/uploads/.gitkeep server/logs/.gitkeep
```

### 4. Run the application

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately:
cd server && npm run dev   # Backend on http://localhost:5000
cd client && npm start     # Frontend on http://localhost:3000
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Min 32-char secret for signing JWT tokens |
| `GEMINI_API_KEY` | ✅ | Google AI Studio key for Gemini 1.5 Flash |
| `PORT` | optional | Server port (default: 5000) |
| `NODE_ENV` | optional | `development` or `production` |
| `CLIENT_URL` | optional | Frontend URL for CORS (default: localhost:3000) |

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register candidate or company |
| POST | `/auth/login` | — | Login and receive JWT |
| GET | `/auth/me` | JWT | Get current user |
| PUT | `/auth/change-password` | JWT | Update password |

### Candidates
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/candidates/profile` | candidate | Get own profile |
| PUT | `/candidates/profile` | candidate | Update profile |
| POST | `/candidates/save-internship/:id` | candidate | Save/unsave internship |

### Internships
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/internships` | public | List/search internships |
| GET | `/internships/:id` | public | Single internship |
| POST | `/internships` | company | Create posting |
| PUT | `/internships/:id` | company | Update |
| DELETE | `/internships/:id` | company | Delete |

### Applications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/applications/:internshipId` | candidate | Apply (runs match score) |
| GET | `/applications/my-applications` | candidate | Own applications |
| GET | `/applications/internship/:id` | company | Applicants for internship |
| PATCH | `/applications/:id/status` | company | Update status |
| PATCH | `/applications/:id/withdraw` | candidate | Withdraw |

### Recommendations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/recommendations` | candidate | Top 10 AI recommendations |
| GET | `/recommendations/explain/:internshipId` | candidate | Gemini explanation |

### Resume
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/resume/upload` | candidate | Upload PDF/DOCX → parse |
| GET | `/resume/my-data` | candidate | Get parsed resume data |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | admin | Platform-wide analytics |
| GET | `/admin/diversity-stats` | admin | Diversity breakdown |
| GET | `/admin/users` | admin | All users |
| PATCH | `/admin/users/:id/toggle-active` | admin | Activate/deactivate user |

---

## 🧠 How the Matching Engine Works

The matching engine scores each candidate–internship pair across **6 dimensions**:

| Dimension | Weight | Method |
|---|---|---|
| Skill Match | **40%** | Jaccard similarity on required skills + preferred skills + semantic cluster bonus |
| Education | **20%** | Degree tier comparison (Diploma=2 → B.Tech=3 → M.Tech=4 → PhD=5) |
| Experience | **20%** | Month-gap penalty for under-qualification; no penalty for over-qualification |
| Location | **15%** | Exact city (100%) → same state (70%) → remote (85%) → no match (20%) |
| Availability | **3%** | Immediate joiners score highest |
| Profile Quality | **2%** | Completeness bonus (resume, bio, skills, education, links) |

**Final Score = Σ(raw_score × weight) × 100**

### Skill Scoring Detail
- Required skill Jaccard × 60%
- Preferred skill Jaccard × 25%
- Semantic cluster bonus × 15% (10 clusters: Python/ML, JS/React, DevOps, Cloud, etc.)

### Fairness Re-ranking
After scoring, a transparent diversity boost is added:

| Category | Boost |
|---|---|
| SC | +5 points |
| ST | +7 points |
| OBC | +3 points |
| PWD | +8 points |
| EWS | +4 points |

The boost is always disclosed in the recommendation explanation.

---

## 📄 How Resume Parsing Works

The resume parser (`server/services/resumeParser.js`) is a **6-stage pipeline**:

1. **File validation** — checks existence, size (≤5MB), format
2. **Text extraction** — PDF via `pdf-parse`, DOCX via `docx-parser`
3. **Section detection** — regex-based sectioning into Header, Skills, Education, Experience, Projects, Certifications
4. **Field extraction** — 11 specialized extractors:
   - Name, Email, Phone, Links (LinkedIn/GitHub)
   - Skills (200+ skills across 11 tech categories)
   - Education (11 degree patterns, CGPA extraction)
   - Experience (job titles, date ranges, responsibilities)
   - Projects (tech stack, links per project)
   - Summary, Certifications, Languages
5. **Normalization** — deduplication, lowercasing, cleanup
6. **Confidence scoring** — 0.0–1.0 score per field

After parsing, **Gemini AI** enhances the extracted skills list by inferring implied skills.

The parsed data is stored in `ResumeData` and the candidate profile is **auto-updated** with skills, education, and experience.

---

## 🎭 Demo Accounts

You can seed the database with demo accounts or use these credentials after running:

```
Candidate: candidate@demo.com / Demo1234
Company:   company@demo.com  / Demo1234
Admin:     admin@demo.com    / Demo1234
```

---

## 🧪 Running Tests

```bash
cd server
npx jest --verbose
```

Tests cover:
- All 6 matching dimension scorers
- Master score calculator
- Top recommendations batch function
- Fairness service (boost, quota guard, Shannon entropy)
- Resume parser (all 11 extractors + edge cases)

---

## 🚢 Deployment

### Backend (Railway / Render)
1. Push to GitHub
2. Create new service in Railway/Render → connect repo
3. Set root directory to `server`
4. Add all env vars from `.env.example`
5. Build command: `npm install`
6. Start command: `node server.js`

### Frontend (Vercel / Netlify)
1. Build: `cd client && npm run build`
2. Serve the `client/build` directory
3. Set `REACT_APP_API_URL` to your backend URL

### MongoDB Atlas
1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Whitelist your server IP (or `0.0.0.0/0` for development)
3. Copy the connection string to `MONGODB_URI`

---

## 🛡 Security Features

- **Helmet.js** — HTTP security headers
- **CORS** — restricted to `CLIENT_URL`
- **Rate limiting** — 200 req/15min global, 10 req/15min auth, 20 req/min AI
- **bcryptjs** — password hashing (salt rounds: 12)
- **JWT** — stateless authentication with expiry
- **Input validation** — express-validator on all mutation endpoints
- **Multer** — file type and size enforcement

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| AI | Google Gemini 1.5 Flash |
| Auth | JWT, bcryptjs |
| File Upload | Multer |
| Resume Parsing | pdf-parse, docx-parser |
| Logging | Winston |
| Testing | Jest |
| Dev | Nodemon, Concurrently |

---

## 📝 License

MIT © 2025 — Built for educational and demonstration purposes.
