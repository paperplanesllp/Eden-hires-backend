# PDF Resume Upload System - Production Ready Configuration

## Overview

This document explains the complete PDF resume upload system for the Eden Hires backend. It includes configuration files, code explanations, and answers to common Cloudinary issues.

---

## File Structure

```
server/src/
├── config/
│   ├── cloudinary.js         (NEW) Cloudinary initialization
│   ├── multer.js             (NEW) File upload middleware
│   └── db.js                 (existing)
├── controllers/
│   ├── jobController.js      (UPDATED) Upload logic with filename preservation
│   └── contactController.js
├── routes/
│   ├── jobRoutes.js          (UPDATED) Uses config files
│   └── contactRoutes.js
└── server.js
```

---

## Why the Previous Setup Failed

### 1. **PDFs Showing as Images in Cloudinary Media Library**

**Root Cause:** `resource_type: "auto"`

When Cloudinary sees `resource_type: "auto"`, it attempts to automatically detect the file type. For PDFs, this auto-detection often fails or misclassifies them as images because:
- PDFs have binary headers that can look like image data
- Cloudinary's auto-detection isn't reliable for document formats
- Once misclassified, Cloudinary treats them as image files (subject to image transformations and restrictions)

**Solution:** `resource_type: "raw"`

Explicitly setting `resource_type: "raw"` tells Cloudinary:
```
"This is a document, not an image. Store it as a binary file without processing."
```

### 2. **"Blocked for Delivery" in Cloudinary Dashboard**

**Root Cause:** Missing `access_control: [{ access_type: "anonymous" }]`

Cloudinary's default behavior is to require authentication for file access (for security). Without explicit access control settings:
- Files are uploaded with restricted delivery
- Cloudinary blocks CDN delivery (marks as "Blocked for delivery")
- Returned URLs return 401 Unauthorized
- HR cannot open PDFs directly from email links

**Solution:** Explicit Anonymous Access Control

```javascript
access_control: [
  {
    access_type: "anonymous", // Allow public CDN delivery
  },
]
```

This tells Cloudinary:
```
"This file should be publicly accessible. Serve it via CDN without authentication."
```

### 3. **URLs Returning 401 Access Denied**

**Root Cause:** Combination of above issues + missing `secure: true` in config

The 401 errors occurred because:
- Files were marked as "delivery blocked" (Cloudinary restriction)
- Configuration didn't enforce HTTPS (insecure URLs may be rejected)
- Access control wasn't set to anonymous (required authentication)

**Solution:** 

1. Add `secure: true` to Cloudinary config initialization:
```javascript
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true, // ← Enforces HTTPS for all URLs
});
```

2. Use `access_control: [{ access_type: "anonymous" }]` in upload options

---

## Configuration Files

### 1. `config/cloudinary.js`

**Purpose:** Centralized Cloudinary SDK initialization

**Key Features:**
- Validates all required environment variables
- Initializes with `secure: true` (enforces HTTPS)
- Provides clear error messages if credentials are missing
- Can be imported and reused across controllers

**Usage:**
```javascript
const cloudinary = require("../config/cloudinary");

// Now cloudinary is ready to use with proper configuration
cloudinary.uploader.upload_stream(options, callback);
```

**Environment Variables Required:**
```
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

---

### 2. `config/multer.js`

**Purpose:** File upload middleware configuration

**Key Features:**
- Uses `multer.memoryStorage()` (no disk writes)
- Validates file MIME type (PDF only)
- Enforces 5MB file size limit
- Provides logging for debugging
- Rejects non-PDF files early

**How It Works:**
1. Client sends FormData with file in "resume" field
2. Multer middleware validates:
   - File is PDF (`application/pdf`)
   - File size < 5MB
3. If valid: stores file as Buffer in `req.file.buffer`
4. If invalid: rejects with error message
5. Controller receives validated file

**Usage:**
```javascript
const upload = require("../config/multer");

router.post("/", upload.single("resume"), controller);
// After this middleware, req.file = { buffer, originalname, mimetype, size }
```

---

### 3. `controllers/jobController.js` - `uploadResume()` Function

**Purpose:** Handle actual upload to Cloudinary with proper configuration

**Critical Upload Options Explained:**

```javascript
const uploadOptions = {
  // Organization in Cloudinary dashboard
  folder: "edenhire/resumes",

  // CRITICAL: Store as raw file, not image
  // Prevents misclassification and auto-blocking
  resource_type: "raw",

  // Standard upload type
  type: "upload",

  // Preserve original filename
  use_filename: true,

  // Add suffix if file exists (resume.pdf → resume-3.pdf)
  unique_filename: true,

  // Don't overwrite existing files
  overwrite: false,

  // CRITICAL: Allow public CDN delivery
  // Without this, files are "Blocked for delivery"
  access_control: [
    {
      access_type: "anonymous", // Public access, no auth required
    },
  ],

  // Ensure PDF format is preserved
  format: "pdf",

  // Store metadata for debugging
  context: {
    original_filename: originalName,
    upload_timestamp: new Date().toISOString(),
  },

  // Prevent automatic blocking/moderation
  // Requires manual review if flagged (doesn't auto-block)
  moderation: "manual",
};
```

**Expected Output URL Format:**
```
https://res.cloudinary.com/<cloud-name>/raw/upload/v<version>/edenhire/resumes/<filename>.pdf
```

Example:
```
https://res.cloudinary.com/acmecorp/raw/upload/v1718030456/edenhire/resumes/john_doe_resume.pdf
```

---

## Routes

### `routes/jobRoutes.js`

**Endpoint:** `POST /api/jobs`

**Request:**
```
FormData:
- resume (file): PDF file, max 5MB
- name (text): Candidate name
- email (text): Candidate email
- phone (text): Candidate phone
- currentRole (text): Current job title
- experience (text): Years of experience
- workPreference (text): Remote, hybrid, on-site
- skills (text): Candidate skills
- location (text): Candidate location
- linkedin (text): LinkedIn profile URL
- roleLookingFor (text): Desired role
```

**Process Flow:**
```
1. Client sends multipart/form-data POST /api/jobs
2. Multer middleware validates PDF file
3. jobController.createJob() receives request
4. uploadResume() sends to Cloudinary
5. Cloudinary returns secure_url
6. Resume saved to MongoDB
7. Email sent to HR with clickable PDF link
8. Response sent to client
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your application! We will review it and contact you soon.",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "resumeUrl": "https://res.cloudinary.com/.../resume.pdf",
    "createdAt": "2024-06-08T12:34:56Z"
  }
}
```

---

## Complete Code Summary

### `config/cloudinary.js`
- Validates credentials
- Initializes with `secure: true`
- Exports configured cloudinary instance

### `config/multer.js`
- Validates MIME type (PDF only)
- Enforces 5MB limit
- Exports multer middleware

### `controllers/jobController.js`
- Imports cloudinary from config
- `uploadResume()` function with robust error handling
- Passes `req.file.originalname` to preserve filename
- Uses all critical upload options
- Complete logging for debugging

### `routes/jobRoutes.js`
- Imports multer from config
- Single route: `POST /` (uploads resume)
- Passes through multer middleware, then controller

---

## Testing the Upload

### Test with cURL:
```bash
curl -X POST http://localhost:5000/api/jobs \
  -F "resume=@path/to/resume.pdf" \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "phone=555-1234" \
  -F "currentRole=Software Engineer" \
  -F "experience=5" \
  -F "workPreference=Remote" \
  -F "skills=JavaScript, React, Node.js" \
  -F "location=San Francisco" \
  -F "linkedin=https://linkedin.com/in/johndoe" \
  -F "roleLookingFor=Senior Software Engineer"
```

### Expected Response:
```json
{
  "success": true,
  "message": "Thank you for your application! We will review it and contact you soon.",
  "data": {
    "resumeUrl": "https://res.cloudinary.com/<cloud>/raw/upload/v<v>/edenhire/resumes/resume.pdf"
  }
}
```

### Verify URL:
Open the returned URL in a browser - the PDF should open directly without any authentication prompts.

---

## Troubleshooting

### Problem: "Cannot find module 'resend'"
**Solution:** Run `npm install resend` in the server directory

### Problem: "Missing Cloudinary environment variables"
**Solution:** Ensure `.env` file contains:
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Problem: File uploads but URL returns 401
**Possible causes:**
1. Access control not set to anonymous
2. `secure: true` missing from config
3. Old code still running (restart server after changes)

**Solution:** Verify the upload options include:
```javascript
access_control: [{ access_type: "anonymous" }],
secure: true, // in cloudinary.config()
```

### Problem: Files showing as images in Media Library
**Cause:** `resource_type: "auto"` or `resource_type: "image"`

**Solution:** Use `resource_type: "raw"`

### Problem: Files marked "Blocked for delivery"
**Cause:** Missing `access_control` or wrong `access_type`

**Solution:** 
```javascript
access_control: [{ access_type: "anonymous" }]
```

---

## Environment Setup

### Install Dependencies:
```bash
npm install cloudinary multer
```

### .env File:
```
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
HR_EMAIL=hr@edenhire.ai
MONGODB_URI=<your-mongodb-uri>
```

### Start Server:
```bash
npm start       # production
npm run dev     # development with nodemon
```

---

## Performance Considerations

1. **Memory Storage:** Files are buffered in RAM
   - For resumes (typically <1MB), this is fine
   - Max 5MB limit prevents memory issues

2. **Upload Stream:** Direct buffer-to-Cloudinary streaming
   - No temporary disk files
   - Efficient for single-file uploads

3. **Asynchronous:** Email send is non-blocking
   - If email fails, upload still succeeds
   - HR can retrieve resume from MongoDB

---

## Security Considerations

1. **API Credentials:** Never commit `.env` file
2. **File Type Validation:** Multer checks MIME type
3. **File Size Limit:** 5MB prevents DoS attacks
4. **Public Access:** Anonymous access is intentional (HR needs to open links)
5. **HTTPS Only:** `secure: true` enforces encrypted URLs

---

## Future Enhancements

1. **Virus Scanning:** Add antivirus scan before upload
2. **Resume Parsing:** Extract text from PDF for searchability
3. **Download Logging:** Track when resumes are accessed
4. **Expiration:** Set URL expiration for sensitive data
5. **Backup:** Archive resumes to separate storage

---

## References

- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_sdk)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Cloudinary Upload Options](https://cloudinary.com/documentation/image_upload_api_reference)
