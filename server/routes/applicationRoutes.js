"use strict";
const express = require("express");
const router  = express.Router();
const {
  applyToInternship, getMyApplications, getInternshipApplicants,
  updateApplicationStatus, withdrawApplication,
  markCompleted, getCertificate, verifyCertificate,
} = require("../controllers/applicationController");
const { protect }   = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

// Public — certificate verification
router.get("/verify/:certId", verifyCertificate);

// Candidate
router.post("/:internshipId",               protect, authorize("candidate"), applyToInternship);
router.get ("/my-applications",             protect, authorize("candidate"), getMyApplications);
router.patch("/:id/withdraw",               protect, authorize("candidate"), withdrawApplication);
router.get ("/certificate/:applicationId",  protect, authorize("candidate"), getCertificate);

// Company
router.get  ("/internship/:internshipId",   protect, authorize("company"),   getInternshipApplicants);
router.patch("/:id/status",                 protect, authorize("company"),   updateApplicationStatus);
router.patch("/:id/complete",               protect, authorize("company"),   markCompleted);

module.exports = router;