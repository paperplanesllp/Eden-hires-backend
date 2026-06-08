const express = require("express");
const upload = require("../config/multer");
const router = express.Router();

const { createJob } = require("../controllers/jobController");

/**
 * POST /api/jobs
 * 
 * Accepts FormData with:
 * - Field "resume": PDF file (max 5MB)
 * - Fields: name, email, phone, currentRole, experience, workPreference, skills, location, linkedin, roleLookingFor
 * 
 * Process:
 * 1. Multer validates file (PDF only, max 5MB)
 * 2. File buffer stored in req.file
 * 3. Controller uploads to Cloudinary
 * 4. URL saved to MongoDB
 * 5. Email sent to HR
 */
router.post("/", upload.single("resume"), createJob);

module.exports = router;
