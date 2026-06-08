const multer = require("multer");

/**
 * Multer Configuration Module
 * 
 * Purpose:
 * - Configure file upload handling before Cloudinary processing
 * - Use memory storage (files are buffered in RAM, not written to disk)
 * - Validate file size and type before upload
 * 
 * Design Rationale:
 * - memoryStorage(): Files stay in memory; no disk I/O overhead
 *   This works well with Cloudinary upload_stream which accepts buffers
 * - fileSize limit: 5MB is standard for resume uploads (PDFs are typically <1MB)
 * - Mime type validation: Only accept PDF MIME types to reject invalid files early
 */

// Configure multer for file uploads
const upload = multer({
  // Use memory storage: keeps file in RAM as a Buffer
  // This Buffer is then passed to Cloudinary's upload_stream
  storage: multer.memoryStorage(),

  // File size limits
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },

  // Optionally validate file type (MIME type)
  // Resume files should be PDF only
  fileFilter: (req, file, callback) => {
    console.log("[MULTER][FILE_FILTER]", {
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    // Accept PDF files only
    const validMimeTypes = ["application/pdf"];
    if (!validMimeTypes.includes(file.mimetype)) {
      const error = new Error(
        `Invalid file type: ${file.mimetype}. Only PDF files are accepted.`
      );
      console.warn("[MULTER][FILE_FILTER][REJECTED]", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        reason: "Not a PDF",
      });
      return callback(error);
    }

    // File is valid, proceed
    console.log("[MULTER][FILE_FILTER][ACCEPTED]", {
      originalname: file.originalname,
      size: file.size,
    });
    callback(null, true);
  },
});

/**
 * Export multer middleware for single file upload
 * Usage in routes: router.post("/", upload.single("resume"), controller)
 * 
 * - single("resume"): Expects one file with form field name "resume"
 * - After this middleware, req.file will contain: { buffer, originalname, mimetype, size }
 */
module.exports = upload;
