const Job = require("../models/Job");
const { v2: cloudinary } = require("cloudinary");
const sendEmail = require("../utils/sendEmail");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
  try {
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required.",
      });
    }

    const uploadedResume = await uploadResume(req.file.buffer);
    const resumeUrl = uploadedResume.secure_url;

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

    await sendEmail({
      to: "hr@edenhire.ai",
      subject: "New Candidate Application",
      replyTo: email,
      text: buildCandidateEmail(job),
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { createJob };
