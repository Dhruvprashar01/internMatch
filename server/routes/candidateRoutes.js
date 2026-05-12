const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, getCandidateById, getAllCandidates, toggleSaveInternship } = require("../controllers/candidateController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");

router.get("/profile", protect, authorize("candidate"), getProfile);
router.put("/profile", protect, authorize("candidate"), updateProfile);
router.post("/save-internship/:internshipId", protect, authorize("candidate"), toggleSaveInternship);
router.get("/", protect, authorize("admin"), getAllCandidates);
router.get("/:id", protect, authorize("company", "admin"), getCandidateById);

module.exports = router;
