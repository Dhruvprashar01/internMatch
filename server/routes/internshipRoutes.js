const express = require("express");
const router = express.Router();
const {
  createInternship, getAllInternships, getInternshipById,
  updateInternship, deleteInternship, getMyInternships,
} = require("../controllers/internshipController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");
const { internshipValidators } = require("../utils/validators");
const { validate } = require("../middleware/validate");

router.get("/", getAllInternships);
router.get("/company/my-internships", protect, authorize("company"), getMyInternships);
router.get("/:id", getInternshipById);
router.post("/", protect, authorize("company"), internshipValidators.create, validate, createInternship);
router.put("/:id", protect, authorize("company"), updateInternship);
router.delete("/:id", protect, authorize("company", "admin"), deleteInternship);

module.exports = router;
