const Job = require("../models/Job");
const uploadResumeToCloudinary = require("../utils/uploadResumeToCloudinary");
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
    // Use the reusable upload utility
    const uploadedResume = await uploadResumeToCloudinary(req.file);
    const resumeUrl = uploadedResume.secure_url;
    const resumePublicId = uploadedResume.public_id;
    
    console.log("[CLOUDINARY] Upload successful", {
      public_id: resumePublicId,
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
      resumePublicId,
    });
    console.log("[DB] Job saved successfully", {
      id: job._id,
      resumeUrl,
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
