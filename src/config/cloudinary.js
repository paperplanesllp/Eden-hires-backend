const { v2: cloudinary } = require("cloudinary");

/**
 * Cloudinary Configuration Module
 * 
 * Purpose:
 * - Centralize Cloudinary SDK initialization
 * - Ensure proper settings for PDF uploads
 * - Provide validation and error logging
 * 
 * Key Settings Explained:
 * - secure: true → Forces HTTPS URLs (required for production)
 * - api_version: "v1_1" → Standard Cloudinary API version (explicit for clarity)
 */

const CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const API_KEY = (process.env.CLOUDINARY_API_KEY || "").trim();
const API_SECRET = (process.env.CLOUDINARY_API_SECRET || "").trim();

/**
 * Validate that all required Cloudinary credentials are present
 * Logs a clear error if any credentials are missing
 */
if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  const missingVars = [];
  if (!CLOUD_NAME) missingVars.push("CLOUDINARY_CLOUD_NAME");
  if (!API_KEY) missingVars.push("CLOUDINARY_API_KEY");
  if (!API_SECRET) missingVars.push("CLOUDINARY_API_SECRET");

  console.error(
    "[CLOUDINARY][CONFIG][ERROR] Missing required environment variables:",
    missingVars.join(", ")
  );
  console.error(
    "[CLOUDINARY][CONFIG] Uploads will fail. Please set environment variables in your .env file."
  );
}

/**
 * Initialize Cloudinary with credentials and production settings
 */
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true, // Force HTTPS for all generated URLs
  api_version: "v1_1", // Explicit API version
});

console.log("[CLOUDINARY][CONFIG][SUCCESS]", {
  cloud_name: CLOUD_NAME,
  secure: true,
  timestamp: new Date().toISOString(),
});

module.exports = cloudinary;
