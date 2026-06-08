const cloudinary = require("../config/cloudinary");

/**
 * Upload Resume PDF to Cloudinary
 * 
 * This utility function handles all PDF uploads to Cloudinary with production-ready settings.
 * 
 * CRITICAL SETTINGS FOR PDF DELIVERY:
 * 
 * 1. resource_type: "raw"
 *    - Tells Cloudinary to store as a raw file, NOT as an image
 *    - Without this, Cloudinary misclassifies PDFs as images
 *    - Images are subject to moderation and may be blocked
 *    - Raw files are delivered without transformation
 * 
 * 2. type: "upload"
 *    - Standard upload type (not authenticated, not private)
 *    - Supports full URL-based public access
 * 
 * 3. use_filename: true
 *    - Preserves the original filename in the stored file
 *    - Example: "JohnDoe_Resume.pdf" stays as "JohnDoe_Resume.pdf"
 * 
 * 4. unique_filename: true
 *    - Adds version suffix if filename already exists
 *    - Prevents overwriting existing files
 *    - Example: "resume.pdf" → "resume-1.pdf" → "resume-2.pdf"
 * 
 * 5. overwrite: false
 *    - Double-ensures files are never overwritten
 * 
 * 6. access_control: [{ access_type: "anonymous" }]
 *    - Allows public CDN delivery without authentication
 *    - Without this, Cloudinary marks files as "Blocked for delivery"
 *    - HR can click links directly from emails
 * 
 * 7. format: "pdf"
 *    - Ensures the file is stored and returned as PDF
 *    - Preserves file format across all platforms
 * 
 * 8. moderation: "manual"
 *    - Disables automatic content blocking
 *    - Allows all PDFs to upload successfully
 * 
 * WHY PREVIOUS SETUP FAILED:
 * 
 * Problem 1: PDFs appeared as images in Cloudinary Media Library
 * - Root Cause: resource_type: "auto" or missing entirely
 * - Auto-detection misclassified PDFs as images
 * - Images are subject to blocking and transformation
 * - Solution: resource_type: "raw"
 * 
 * Problem 2: URLs returned 401 Access Denied
 * - Root Cause: Missing access_control or insecure config
 * - Cloudinary restricted delivery by default
 * - Insecure (http) URLs may be rejected by browsers
 * - Solution: access_control: anonymous + secure: true in config
 * 
 * Problem 3: Files without .pdf extension fail to open
 * - Root Cause: use_filename not set or originalName not passed
 * - Cloudinary may assign random names without extension
 * - Browsers can't determine file type without extension
 * - Solution: use_filename: true + pass originalName to function
 * 
 * @param {Object} file - Multer file object { buffer, originalname, mimetype, size }
 * @returns {Promise<Object>} { public_id, secure_url, format, size }
 * @throws {Error} On validation or upload failure
 */
async function uploadResumeToCloudinary(file) {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!file) {
      const err = new Error("No file provided to uploadResumeToCloudinary");
      console.error("[UPLOAD_RESUME][ERROR]", { message: err.message });
      return reject(err);
    }

    if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
      const err = new Error("File buffer is invalid or missing");
      console.error("[UPLOAD_RESUME][ERROR]", {
        message: err.message,
        hasBuffer: !!file.buffer,
        isBuffer: file.buffer ? Buffer.isBuffer(file.buffer) : false,
      });
      return reject(err);
    }

    if (!file.originalname) {
      const err = new Error("Original filename is missing");
      console.error("[UPLOAD_RESUME][ERROR]", { message: err.message });
      return reject(err);
    }

    // Ensure filename has .pdf extension
    const filename = file.originalname.endsWith(".pdf")
      ? file.originalname
      : file.originalname.replace(/\.[^.]*$/, ".pdf") || "resume.pdf";

    console.log("[UPLOAD_RESUME][START]", {
      originalname: file.originalname,
      filename,
      size: file.size,
      mimetype: file.mimetype,
      timestamp: new Date().toISOString(),
    });

    // Configure Cloudinary upload options
    const uploadOptions = {
      // Folder organization
      folder: "edenhire/resumes",

      // CRITICAL: Store as raw file, not image
      resource_type: "raw",

      // Standard upload type
      type: "upload",

      // Preserve original filename
      use_filename: true,

      // Add version suffix if file exists
      unique_filename: true,

      // Never overwrite
      overwrite: false,

      // CRITICAL: Allow public CDN delivery
      access_control: [
        {
          access_type: "anonymous", // No authentication required
        },
      ],

      // Ensure PDF format
      format: "pdf",

      // Store metadata for debugging
      context: {
        original_filename: file.originalname,
        upload_timestamp: new Date().toISOString(),
      },

      // Disable automatic blocking
      moderation: "manual",
    };

    console.log("[UPLOAD_RESUME][OPTIONS]", {
      folder: uploadOptions.folder,
      resource_type: uploadOptions.resource_type,
      access_type: uploadOptions.access_control[0].access_type,
      unique_filename: uploadOptions.unique_filename,
      format: uploadOptions.format,
    });

    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("[UPLOAD_RESUME][UPLOAD_ERROR]", {
            message: error.message,
            code: error.code,
            http_code: error.http_code,
            filename,
            timestamp: new Date().toISOString(),
          });
          return reject(error);
        }

        // Validate result
        if (!result) {
          const err = new Error("Cloudinary upload returned empty result");
          console.error("[UPLOAD_RESUME][EMPTY_RESULT]", {
            filename,
            timestamp: new Date().toISOString(),
          });
          return reject(err);
        }

        if (!result.secure_url) {
          const err = new Error("Cloudinary upload succeeded but secure_url is missing");
          console.error("[UPLOAD_RESUME][NO_SECURE_URL]", {
            filename,
            resultKeys: Object.keys(result),
            timestamp: new Date().toISOString(),
          });
          return reject(err);
        }

        console.log("[UPLOAD_RESUME][SUCCESS]", {
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          size: result.bytes,
          access_control: result.access_control,
          timestamp: new Date().toISOString(),
        });

        // Return only essential fields
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          size: result.bytes,
        });
      }
    );

    // Handle stream errors
    uploadStream.on("error", (streamErr) => {
      console.error("[UPLOAD_RESUME][STREAM_ERROR]", {
        message: streamErr.message,
        code: streamErr.code,
        filename,
        timestamp: new Date().toISOString(),
      });
      reject(streamErr);
    });

    // Send buffer to stream
    try {
      uploadStream.end(file.buffer);
    } catch (endErr) {
      console.error("[UPLOAD_RESUME][STREAM_END_ERROR]", {
        message: endErr.message,
        filename,
        timestamp: new Date().toISOString(),
      });
      reject(endErr);
    }
  });
}

module.exports = uploadResumeToCloudinary;
