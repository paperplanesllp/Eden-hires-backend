const Job = require("../models/Job");
const cloudinary = require("../config/cloudinary");
const {
  sendEmail,
  formatEmailBody,
  createEmailTemplate,
} = require("../utils/sendEmail");

// HR email for resume notifications
const HR_EMAIL = (process.env.HR_EMAIL || "hr@edenhire.ai").trim();

/**
 * Upload resume to Cloudinary
 * @param {Buffer} fileBuffer - Resume file buffer
 * @returns {Promise<Object>} Cloudinary response with secure_url
 */
/**
 * Upload resume PDF to Cloudinary (raw resource)
 * 
 * CRITICAL SETTINGS FOR PDF DELIVERY:
 * 1. resource_type: "raw" → Stores as raw file (NOT as image)
 *    Without this, Cloudinary treats PDFs as images and may block them
 * 2. access_control: anonymous → Allows public CDN delivery
 *    Without this, Cloudinary marks files as "Blocked for delivery"
 * 3. use_filename: true → Preserves original filename
 * 4. unique_filename: true → Adds version suffix to avoid collisions (e.g., resume.pdf → resume-3.pdf)
 * 5. format: "pdf" → Ensures PDF format is preserved
 * 
 * Why Previous Setup Failed:
 * - resource_type: "auto" let Cloudinary decide → misidentified PDFs as images
 * - Missing access_control → CDN blocked delivery
 * - Not passing originalname → Lost filename context
 * 
 * @param {Buffer} fileBuffer - File buffer from multer memory storage
 * @param {string} originalName - Original filename from upload (e.g., "MyResume.pdf")
 * @returns {Promise<Object>} Result object with public_id, secure_url, and format
 * @throws {Error} On buffer validation, upload, or stream errors
 */
const uploadResume = (fileBuffer, originalName = "resume.pdf") =>
  new Promise((resolve, reject) => {
    // Validate buffer
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      const err = new Error("Invalid file buffer provided to uploadResume");
      console.error("[CLOUDINARY][UPLOAD][ERROR]", {
        message: err.message,
        timestamp: new Date().toISOString(),
      });
      return reject(err);
    }

    // Ensure filename ends with .pdf
    const fileNameWithExtension = originalName.endsWith(".pdf")
      ? originalName
      : originalName.replace(/\.[^.]*$/, ".pdf"); // Replace any extension with .pdf

    console.log("[CLOUDINARY][UPLOAD][START]", {
      originalName,
      fileNameWithExtension,
      fileSize: fileBuffer.length,
      timestamp: new Date().toISOString(),
    });

    const uploadOptions = {
      // Folder organization in Cloudinary
      folder: "edenhire/resumes",

      // CRITICAL: resource_type "raw" ensures PDFs are NOT treated as images
      // This prevents misclassification and automatic blocking
      resource_type: "raw",

      // Standard upload type (vs. authenticated, private, etc.)
      type: "upload",

      // Preserve the original filename with .pdf extension
      use_filename: true,

      // Add version suffix if file already exists (avoids overwrites)
      unique_filename: true,

      // Do NOT overwrite existing files
      overwrite: false,

      // CRITICAL: Set access control to anonymous for public CDN delivery
      // Without this, Cloudinary marks the file as "Blocked for delivery"
      access_control: [
        {
          access_type: "anonymous", // Allow public access via CDN
        },
      ],

      // Ensure format is preserved as PDF
      format: "pdf",

      // Optional: Store metadata for debugging
      context: {
        original_filename: originalName,
        upload_timestamp: new Date().toISOString(),
      },

      // Disable any auto-moderation/blocking rules
      moderation: "manual", // Prevents auto-blocking; requires manual review if flagged
    };

    console.log("[CLOUDINARY][UPLOAD][OPTIONS]", {
      folder: uploadOptions.folder,
      resource_type: uploadOptions.resource_type,
      access_type: uploadOptions.access_control[0].access_type,
      format: uploadOptions.format,
    });

    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        console.error("[CLOUDINARY][UPLOAD][CALLBACK_ERROR]", {
          message: error.message,
          code: error.code,
          http_code: error.http_code,
          timestamp: new Date().toISOString(),
        });
        return reject(error);
      }

      // Validate result
      if (!result) {
        const err = new Error("Cloudinary upload returned empty result");
        console.error("[CLOUDINARY][UPLOAD][EMPTY_RESULT]", {
          timestamp: new Date().toISOString(),
        });
        return reject(err);
      }

      if (!result.secure_url) {
        const err = new Error("Cloudinary upload succeeded but secure_url is missing");
        console.error("[CLOUDINARY][UPLOAD][NO_SECURE_URL]", {
          result_keys: Object.keys(result),
          timestamp: new Date().toISOString(),
        });
        return reject(err);
      }

      console.log("[CLOUDINARY][UPLOAD][SUCCESS]", {
        public_id: result.public_id,
        format: result.format,
        size: result.bytes,
        secure_url: result.secure_url,
        access_control: result.access_control,
        timestamp: new Date().toISOString(),
      });

      resolve(result);
    });

    // Handle stream errors
    uploadStream.on("error", (streamErr) => {
      console.error("[CLOUDINARY][STREAM][ERROR]", {
        message: streamErr.message,
        code: streamErr.code,
        timestamp: new Date().toISOString(),
      });
      reject(streamErr);
    });

    // Send buffer to stream
    try {
      uploadStream.end(fileBuffer);
    } catch (endErr) {
      console.error("[CLOUDINARY][STREAM][END_ERROR]", {
        message: endErr.message,
        stack: endErr.stack,
        timestamp: new Date().toISOString(),
      });
      reject(endErr);
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
    // Pass the original filename so Cloudinary preserves it in the stored file
    const uploadedResume = await uploadResume(req.file.buffer, req.file.originalname);
    const resumeUrl = uploadedResume.secure_url;
    console.log("[CLOUDINARY] Upload successful", {
      public_id: uploadedResume.public_id,
      resumeUrl,
      format: uploadedResume.format,
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
