"use strict";
const express = require("express");
const router  = express.Router();
const {
  getPlatformStats, getDiversityStats,
  getAllUsers, toggleUserStatus, deleteUser,
  getAllInternships, deleteInternship,
  getAllApplications,
  getPendingVerifications, verifyCompany, rejectVerification,
} = require("../controllers/adminController");
const { protect }   = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

router.use(protect, authorize("admin"));

// Stats
router.get("/stats",           getPlatformStats);
router.get("/diversity-stats", getDiversityStats);

// Users
router.get   ("/users",                     getAllUsers);
router.patch ("/users/:id/toggle-active",   toggleUserStatus);
router.delete("/users/:id",                 deleteUser);

// Internships
router.get   ("/internships",        getAllInternships);
router.delete("/internships/:id",    deleteInternship);

// Applications
router.get("/applications", getAllApplications);

// Company Verification
router.get  ("/verifications",                        getPendingVerifications);
router.patch("/verifications/:companyId/approve",     verifyCompany);
router.patch("/verifications/:companyId/reject",      rejectVerification);

module.exports = router;