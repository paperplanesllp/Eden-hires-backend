const cloudinary = require("cloudinary").v2;

/**
 * Cloudinary Configuration Module
 * 
 * Initializes Cloudinary v2 SDK with proper credentials and settings for PDF uploads.
 * 
 * Configuration Settings:
 * - cloud_name: Cloudinary account identifier
 * - api_key: Public API key
 * - api_secret: Private API secret (for server-side uploads)
 * - secure: true → Forces HTTPS for all URLs (required for production)
 * 
 * Environment Variables Required:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

const CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const API_KEY = (process.env.CLOUDINARY_API_KEY || "").trim();
const API_SECRET = (process.env.CLOUDINARY_API_SECRET || "").trim();

// Validate credentials on startup
if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  const missingVars = [];
  if (!CLOUD_NAME) missingVars.push("CLOUDINARY_CLOUD_NAME");
  if (!API_KEY) missingVars.push("CLOUDINARY_API_KEY");
  if (!API_SECRET) missingVars.push("CLOUDINARY_API_SECRET");

  console.error(
    "[CLOUDINARY][CONFIG][ERROR] Missing environment variables:",
    missingVars.join(", ")
  );
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true, // Force HTTPS URLs (prevents 401 errors with insecure protocols)
});

console.log("[CLOUDINARY][INITIALIZED]", {
  cloud_name: CLOUD_NAME,
  secure: true,
  timestamp: new Date().toISOString(),
});

module.exports = cloudinary;
