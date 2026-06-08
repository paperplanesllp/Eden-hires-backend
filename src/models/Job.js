const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    currentRole: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
      required: true,
    },

    workPreference: {
      type: String,
      required: true,
    },

    skills: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    linkedin: {
      type: String,
      required: true,
    },

    roleLookingFor: {
      type: String,
      required: true,
    },

    resumeUrl: {
      type: String,
      required: true,
    },

    resumePublicId: {
      type: String,
      required: false,
      description: "Cloudinary public_id for resume file (enables deletion/updates)",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Job", jobSchema);
