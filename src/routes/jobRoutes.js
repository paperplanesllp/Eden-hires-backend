const express = require("express");
const upload = require("../config/multer");
const { createJob } = require("../controllers/jobController");

const router = express.Router();

/**
 * POST /api/jobs
 * 
 * Upload a candidate resume and create a job application.
 * 
 * Request Format:
 * - Content-Type: multipart/form-data
 * - Field "resume": PDF file (max 5MB, PDF only)
 * - Fields: name, email, phone, currentRole, experience, workPreference, 
 *           skills, location, linkedin, roleLookingFor
 * 
 * Process:
 * 1. Multer validates PDF file (application/pdf, max 5MB)
 * 2. File stored in req.file with Buffer in req.file.buffer
 * 3. uploadResumeToCloudinary() uploads to Cloudinary with production settings
 * 4. Cloudinary returns secure_url (publicly accessible, HTTPS)
 * 5. Job document created in MongoDB with resumeUrl
 * 6. Email sent to HR with resume link
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Thank you for your application!",
 *   "data": {
 *     "_id": "...",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "resumeUrl": "https://res.cloudinary.com/.../edenhire/resumes/JohnDoe_Resume.pdf",
 *     "resumePublicId": "edenhire/resumes/JohnDoe_Resume-1",
 *     ...
 *   }
 * }
 */
router.post("/", upload.single("resume"), createJob);

module.exports = router;
