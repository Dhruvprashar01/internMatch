"use strict";
const express = require("express");
const router  = express.Router();
const { getProfile, updateProfile, requestVerification, getCompanyById, getAllCompanies } = require("../controllers/companyController");
const { protect }   = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

router.get ("/profile",               protect, authorize("company"), getProfile);
router.put ("/profile",               protect, authorize("company"), updateProfile);
router.post("/request-verification",  protect, authorize("company"), requestVerification); // ← NEW
router.get ("/",                       getAllCompanies);
router.get ("/:id",                    getCompanyById);

module.exports = router;