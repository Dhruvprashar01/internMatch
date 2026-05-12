/**
 * server.js — ADDED: Passport + express-session for Google OAuth
 */
"use strict";

require("dotenv").config();

const REQUIRED_ENV = ["MONGODB_URI", "JWT_SECRET", "GEMINI_API_KEY", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];
const missingEnv   = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`\n❌ Missing required env vars: ${missingEnv.join(", ")}`);
  console.error("   Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to server/.env\n");
  process.exit(1);
}

const fs   = require("fs");
const path = require("path");
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const express        = require("express");
const cors           = require("cors");
const helmet         = require("helmet");
const morgan         = require("morgan");
const session        = require("express-session");
const passport       = require("./config/passport");
const mongoSanitize  = require("express-mongo-sanitize");

const connectDB          = require("./config/db");
const { errorHandler }   = require("./middleware/errorHandler");
const { requestLogger }  = require("./middleware/logger");
const { globalRateLimiter } = require("./middleware/rateLimiter");
const { protect }        = require("./middleware/auth");

const authRoutes           = require("./routes/authRoutes");
const candidateRoutes      = require("./routes/candidateRoutes");
const companyRoutes        = require("./routes/companyRoutes");
const internshipRoutes     = require("./routes/internshipRoutes");
const applicationRoutes    = require("./routes/applicationRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const adminRoutes          = require("./routes/adminRoutes");
const resumeRoutes         = require("./routes/resumeRoutes");
const roadmapRoutes        = require("./routes/roadmapRoutes");

const app  = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);
connectDB();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", "data:", "https:"],
      connectSrc:  ["'self'"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      objectSrc:   ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(mongoSanitize({ replaceWith: "_" }));

// ── Session (needed by Passport only during OAuth redirect) ───────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production", maxAge: 5 * 60 * 1000 }, // 5 min
}));

// ── Passport ──────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
}
app.use(requestLogger);

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use("/api/", globalRateLimiter);

// ── Uploads (protected) ───────────────────────────────────────────────────────
app.use("/uploads", protect, (req, res, next) => {
  if (req.path.includes("..") || req.path.includes("\\"))
    return res.status(400).json({ success: false, message: "Invalid path" });
  express.static(path.join(__dirname, "uploads"))(req, res, next);
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",            authRoutes);
app.use("/api/candidates",      candidateRoutes);
app.use("/api/companies",       companyRoutes);
app.use("/api/internships",     internshipRoutes);
app.use("/api/applications",    applicationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/admin",           adminRoutes);
app.use("/api/resume",          resumeRoutes);
app.use("/api/roadmap",         roadmapRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀  Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  console.log(`🌐  http://localhost:${PORT}/api\n`);
});

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} — shutting down gracefully...`);
  server.close(() => {
    require("mongoose").connection.close(false).then(() => {
      console.log("MongoDB closed. Exiting.");
      process.exit(0);
    });
  });
  setTimeout(() => { process.exit(1); }, 10_000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (r) => console.error("⚠️  Unhandled rejection:", r));
process.on("uncaughtException",  (e) => { console.error("💥  Uncaught exception:", e); gracefulShutdown("uncaughtException"); });

module.exports = app;