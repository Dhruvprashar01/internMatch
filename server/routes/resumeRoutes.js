const express = require("express");
const router = express.Router();
const { uploadResume, getMyResumeData } = require("../controllers/resumeController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");
const upload = require("../config/multer");

router.post("/upload", protect, authorize("candidate"), upload.single("resume"), uploadResume);
router.get("/my-data", protect, authorize("candidate"), getMyResumeData);

module.exports = router;
