const Job = require("../models/Job");
const { v2: cloudinary } = require("cloudinary");
const {
  sendEmail,
  formatEmailBody,
  createEmailTemplate,
} = require("../utils/sendEmail");

const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const cloudKey = (process.env.CLOUDINARY_API_KEY || "").trim();
const cloudSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
const HR_EMAIL = (process.env.HR_EMAIL || "hr@edenhire.ai").trim();

if (!cloudName || !cloudKey || !cloudSecret) {
  console.warn("Cloudinary env vars missing or empty; resume uploads may fail.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: cloudKey,
  api_secret: cloudSecret,
  secure: true,
});

/**
 * Upload resume to Cloudinary
 * @param {Buffer} fileBuffer - Resume file buffer
 * @returns {Promise<Object>} Cloudinary response with secure_url
 */
/**
 * Upload resume to Cloudinary (raw resource)
 * - Uses `resource_type: 'raw'` and `type: 'upload'` for PDFs
 * - Sets `access_control` to anonymous so the CDN serves the file publicly
 * - Uses `use_filename` to preserve filename and `unique_filename` to avoid collisions
 * - Accepts a Buffer (from multer memory storage) and optional original filename
 * @param {Buffer} fileBuffer
 * @param {string} [originalName]
 * @returns {Promise<Object>} Cloudinary upload result (includes `secure_url`)
 */
const uploadResume = (fileBuffer, originalName = "resume") =>
  new Promise((resolve, reject) => {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      const err = new Error("Invalid file buffer provided to uploadResume");
      console.error("[CLOUDINARY][UPLOAD][ERROR]", { message: err.message });
      return reject(err);
    }

    const options = {
      folder: "edenhire/resumes",
      resource_type: "raw",
      type: "upload",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      context: `original_filename=${originalName}`,
      access_control: [{ access_type: "anonymous" }],
    };

    console.log("[CLOUDINARY][UPLOAD] Starting upload", { folder: options.folder, resource_type: options.resource_type });

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        console.error("[CLOUDINARY][UPLOAD][ERROR]", { message: error.message, stack: error.stack });
        return reject(error);
      }

      if (!result || !result.secure_url) {
        const err = new Error("Cloudinary upload succeeded but no secure_url was returned");
        console.error("[CLOUDINARY][UPLOAD][NO_URL]", { result });
        return reject(err);
      }

      console.log("[CLOUDINARY][UPLOAD][SUCCESS]", { public_id: result.public_id, secure_url: result.secure_url });
      return resolve(result);
    });

    uploadStream.on("error", (streamErr) => {
      console.error("[CLOUDINARY][STREAM][ERROR]", { message: streamErr.message, stack: streamErr.stack });
      return reject(streamErr);
    });

    try {
      uploadStream.end(fileBuffer);
    } catch (endErr) {
      console.error("[CLOUDINARY][UPLOAD][END_ERROR]", { message: endErr.message, stack: endErr.stack });
      return reject(endErr);
    }
  });

/**
 * Build candidate application email body
 * @param {Object} job - Job document
 * @returns {string} HTML formatted email
 */
const buildCandidateEmail = (job) => {
  const emailData = {
    "Application Type": "Candidate Application",
    Name: job.name,
    Email: job.email,
    "Phone Number": job.phone,
    "Current Role": job.currentRole,
    "Years of Experience": job.experience,
    "Work Preference": job.workPreference,
    Skills: job.skills,
    Location: job.location,
    "LinkedIn Profile": job.linkedin,
    "Role Looking For": job.roleLookingFor,
    "Resume URL": `<a href="${job.resumeUrl}" target="_blank">${job.resumeUrl}</a>`,
    "Submitted At": new Date(job.createdAt).toLocaleString(),
  };

  const tableHtml = formatEmailBody(emailData);
  return createEmailTemplate("New Candidate Application", tableHtml);
};

/**
 * Create job application from candidate
 */
const createJob = async (req, res) => {
  console.log("[START] createJob - Request received", {
    timestamp: new Date().toISOString(),
  });

  try {
    console.log("[STEP] Validating request body");
    const {
      name,
      email,
      phone,
      currentRole,
      experience,
      workPreference,
      skills,
      location,
      linkedin,
      roleLookingFor,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !currentRole ||
      !experience ||
      !workPreference ||
      !skills ||
      !location ||
      !linkedin ||
      !roleLookingFor
    ) {
      console.warn("[VALIDATION] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    console.log("[MULTER] Checking uploaded file");
    if (!req.file) {
      console.log("[MULTER] No file received in request");
      return res.status(400).json({
        success: false,
        message: "Resume file is required.",
      });
    }

    console.log("[MULTER] File received", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      timestamp: new Date().toISOString(),
    });

    console.log("[CLOUDINARY] Uploading resume to Cloudinary");
    const uploadedResume = await uploadResume(req.file.buffer);
    const resumeUrl = uploadedResume.secure_url;
    console.log("[CLOUDINARY] Upload successful", {
      resumeUrl,
      timestamp: new Date().toISOString(),
    });

    // Step 1: Save to MongoDB first (priority over email)
    console.log("[DB] Saving job application to MongoDB");
    const job = await Job.create({
      name,
      email,
      phone,
      currentRole,
      experience,
      workPreference,
      skills,
      location,
      linkedin,
      roleLookingFor,
      resumeUrl,
    });
    console.log("[DB] Job saved successfully", {
      id: job._id,
      timestamp: new Date().toISOString(),
    });

    // Step 2: Send email (non-blocking error)
    try {
      console.log("[EMAIL] Attempting to send email to hr@edenhire.ai");

      const htmlBody = buildCandidateEmail(job);
      const textBody = `
New Candidate Application

Name: ${name}
Email: ${email}
Phone: ${phone}
Current Role: ${currentRole}
Years of Experience: ${experience}
Work Preference: ${workPreference}
Skills: ${skills}
Location: ${location}
LinkedIn Profile: ${linkedin}
Role Looking For: ${roleLookingFor}
Resume URL: ${resumeUrl}
`;

      await sendEmail({
        to: HR_EMAIL,
        subject: "New Candidate Application",
        text: textBody,
        html: htmlBody,
        replyTo: email,
      });

      console.log("[EMAIL] Email sent successfully to hr@edenhire.ai", {
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      // Log email error but don't fail the response
      console.error("[EMAIL WARNING] Email sending failed (non-blocking)", {
        message: emailError.message,
        code: emailError.code,
        recipient: HR_EMAIL,
        jobId: job._id,
        timestamp: new Date().toISOString(),
      });

      // Still return success since MongoDB save and resume upload succeeded
    }

    console.log("[STEP] Response returning success");
    return res.status(201).json({
      success: true,
      message: "Thank you for your application! We will review it and contact you soon.",
      data: job,
    });
  } catch (error) {
    console.error("[ERROR] Job creation failed", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your application. Please try again later.",
    });
  }
};

module.exports = { createJob };
