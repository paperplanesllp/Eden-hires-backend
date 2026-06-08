const multer = require("multer");

/**
 * Multer Configuration for Resume Uploads
 * 
 * Configuration:
 * - Storage: Memory (no disk writes, files buffered in RAM)
 * - File Type: PDF only (application/pdf MIME type)
 * - Max Size: 5MB (standard for resume files)
 * - Field Name: "resume" (expected in multipart/form-data)
 */

// Accept PDF files only
const fileFilter = (req, file, callback) => {
  if (file.mimetype === "application/pdf") {
    console.log("[MULTER][FILE][ACCEPTED]", {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
    callback(null, true);
  } else {
    const error = new Error(
      `Invalid file type: ${file.mimetype}. Only PDF files are accepted.`
    );
    console.warn("[MULTER][FILE][REJECTED]", {
      filename: file.originalname,
      mimetype: file.mimetype,
      reason: "Not a PDF",
    });
    callback(error);
  }
};

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(), // Buffer in RAM, not disk
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter, // Validate file type
});

module.exports = upload;
