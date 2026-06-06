const Job = require("../models/Job");
const { v2: cloudinary } = require("cloudinary");
const { sendEmail } = require("../utils/sendEmail");

const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const cloudKey = (process.env.CLOUDINARY_API_KEY || "").trim();
const cloudSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();

if (!cloudName || !cloudKey || !cloudSecret) {
  console.warn("Cloudinary env vars missing or empty; resume uploads may fail.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: cloudKey,
  api_secret: cloudSecret,
});

const uploadResume = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "edenhire/resumes",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });

const buildCandidateEmail = (candidate) => `
New candidate application

Name: ${candidate.name}
Email: ${candidate.email}
Phone: ${candidate.phone}
Current Role: ${candidate.currentRole}
Experience: ${candidate.experience}
Work Preference: ${candidate.workPreference}
Skills: ${candidate.skills}
Location: ${candidate.location}
LinkedIn: ${candidate.linkedin}
Role Looking For: ${candidate.roleLookingFor}
Resume URL: ${candidate.resumeUrl}
`;

const createJob = async (req, res) => {
  console.log("[START] createJob - Request received");
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
    });

    console.log("[CLOUDINARY] Uploading resume to Cloudinary");
    const uploadedResume = await uploadResume(req.file.buffer);
    const resumeUrl = uploadedResume.secure_url;
    console.log("[CLOUDINARY] Upload successful", { resumeUrl });

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
    console.log("[DB] Job saved successfully", { id: job._id });

    console.log("[EMAIL] Attempting to send email to hr@edenhire.ai");
    await sendEmail({
      to: "hr@edenhire.ai",
      subject: "New Candidate Application",
      replyTo: email,
      text: buildCandidateEmail(job),
    });
    console.log("[EMAIL] Email sent successfully to hr@edenhire.ai");

    console.log("[STEP] Response returning");
    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("[ERROR]", error);
    console.error("[ERROR MESSAGE]", error.message);
    console.error("[STACK]", error.stack);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { createJob };
