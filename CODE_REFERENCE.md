# Complete Updated Code Reference

## File 1: sendEmail.js
**Location**: `/src/utils/sendEmail.js`

```javascript
const nodemailer = require("nodemailer");

// Configuration from environment variables
const emailUser = (process.env.EMAIL_USER || "").trim();
const emailPass = (process.env.EMAIL_PASS || "").trim();
const smtpHost = (process.env.SMTP_HOST || "smtp.hostinger.com").trim();
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure =
  process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465;

// Validate email configuration
if (!emailUser) {
  console.error("[EMAIL CONFIG] EMAIL_USER is missing");
}

if (!emailPass) {
  console.error("[EMAIL CONFIG] EMAIL_PASS is missing");
}

console.log("[EMAIL CONFIG]", {
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  emailUser,
  hasPassword: !!emailPass,
});

// Create SMTP transporter with Hostinger configuration
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

/**
 * Format email body with labeled fields
 * @param {Object} data - Object with field labels and values
 * @returns {string} HTML formatted email body
 */
const formatEmailBody = (data) => {
  const rows = Object.entries(data)
    .map(
      ([key, value]) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333; width: 35%;">${key}:</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; color: #666;">${
            value || "N/A"
          }</td>
        </tr>`
    )
    .join("");

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      ${rows}
    </table>
  `;
};

/**
 * Create HTML email template
 * @param {string} title - Email title/heading
 * @param {string} tableHtml - Formatted table HTML
 * @returns {string} Complete HTML email
 */
const createEmailTemplate = (title, tableHtml) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #1a1a2e; color: #fff; padding: 20px; border-radius: 4px 4px 0 0; }
        .content { background-color: #fff; padding: 20px; border-radius: 0 0 4px 4px; border: 1px solid #e0e0e0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        h1 { margin: 0; font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${tableHtml}
        </div>
        <div class="footer">
          <p>This is an automated message from Eden Hire Application System</p>
        </div>
      </div>
    </body>
  </html>
`;

/**
 * Send email with error handling and logging
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body (fallback)
 * @param {string} options.html - HTML body
 * @param {string} options.replyTo - Reply-to email address
 * @returns {Promise<Object>} Nodemailer response info
 * @throws {Error} Throws error if email credentials are missing
 */
const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  try {
    if (!emailUser || !emailPass) {
      throw new Error("EMAIL_USER or EMAIL_PASS is not configured");
    }

    console.log("[EMAIL] Sending email", {
      to,
      subject,
      replyTo,
      timestamp: new Date().toISOString(),
    });

    const mailOptions = {
      from: `"Eden Hire" <${emailUser}>`,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
      ...(replyTo ? { replyTo } : {}),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("[EMAIL] Email sent successfully", {
      messageId: info.messageId,
      response: info.response,
      timestamp: new Date().toISOString(),
    });

    return info;
  } catch (error) {
    console.error("[EMAIL ERROR]", {
      message: error.message,
      code: error.code,
      command: error.command,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
};

/**
 * Verify SMTP transporter connection
 * @returns {Promise<boolean>} Returns true if connection is successful
 */
const verifyTransporter = async () => {
  try {
    console.log("[EMAIL] Verifying SMTP connection...");

    await transporter.verify();

    console.log("[EMAIL] SMTP connection verified successfully");

    return true;
  } catch (error) {
    console.error("[EMAIL] SMTP verification failed", {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      command: error.command,
    });

    return false;
  }
};

module.exports = {
  sendEmail,
  verifyTransporter,
  formatEmailBody,
  createEmailTemplate,
};
```

---

## File 2: contactController.js
**Location**: `/src/controllers/contactController.js`

```javascript
const Contact = require("../models/Contact");
const {
  sendEmail,
  formatEmailBody,
  createEmailTemplate,
} = require("../utils/sendEmail");

const SALES_EMAIL = (process.env.SALES_EMAIL || "sales@edenhire.ai").trim();
const HR_EMAIL = (process.env.HR_EMAIL || "hr@edenhire.ai").trim();

/**
 * Build hiring inquiry email body
 * @param {Object} contact - Contact document
 * @returns {string} HTML formatted email
 */
const buildHiringEmail = (contact) => {
  const emailData = {
    "Inquiry Type": "Hiring",
    Name: contact.name,
    Email: contact.email,
    "Phone Number": contact.phone,
    Company: contact.company,
    "Role Hiring For": contact.role,
    "Team Size": contact.teamSize,
    "Funding Stage": contact.fundingStage,
    "Key Challenge": contact.challenge,
    "Submitted At": new Date(contact.createdAt).toLocaleString(),
  };

  const tableHtml = formatEmailBody(emailData);
  return createEmailTemplate("New Hiring Inquiry", tableHtml);
};

/**
 * Create contact from hiring inquiry
 */
const createContact = async (req, res) => {
  console.log("[START] createContact - Request received", {
    timestamp: new Date().toISOString(),
  });

  try {
    console.log("[STEP] Validating request body");
    const {
      name,
      company,
      email,
      phone,
      role,
      teamSize,
      fundingStage,
      challenge,
    } = req.body;

    // Validate required fields
    if (!name || !company || !email || !phone || !role || !teamSize || !fundingStage || !challenge) {
      console.warn("[VALIDATION] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Step 1: Save to MongoDB first (priority over email)
    console.log("[DB] Saving contact to MongoDB");
    const contact = await Contact.create({
      name,
      company,
      email,
      phone,
      role,
      teamSize,
      fundingStage,
      challenge,
    });
    console.log("[DB] Contact saved successfully", {
      id: contact._id,
      timestamp: new Date().toISOString(),
    });

    // Step 2: Send email (non-blocking error)
    try {
      console.log("[EMAIL] Attempting to send email to sales@edenhire.ai");

      const htmlBody = buildHiringEmail(contact);
      const textBody = `
New Hiring Inquiry

Name: ${name}
Email: ${email}
Phone: ${phone}
Company: ${company}
Role Hiring For: ${role}
Team Size: ${teamSize}
Funding Stage: ${fundingStage}
Key Challenge: ${challenge}
`;

      await sendEmail({
        to: SALES_EMAIL,
        subject: "New Hiring Inquiry",
        text: textBody,
        html: htmlBody,
        replyTo: email,
      });

      console.log("[EMAIL] Email sent successfully to sales@edenhire.ai", {
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      // Log email error but don't fail the response
      console.error("[EMAIL WARNING] Email sending failed (non-blocking)", {
        message: emailError.message,
        code: emailError.code,
        recipient: SALES_EMAIL,
        contactId: contact._id,
        timestamp: new Date().toISOString(),
      });

      // Still return success since MongoDB save succeeded
    }

    console.log("[STEP] Response returning success");
    return res.status(201).json({
      success: true,
      message: "Thank you! We have received your inquiry and will contact you soon.",
      data: contact,
    });
  } catch (error) {
    console.error("[ERROR] Contact creation failed", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your inquiry. Please try again later.",
    });
  }
};

module.exports = {
  createContact,
};
```

---

## File 3: jobController.js
**Location**: `/src/controllers/jobController.js`

```javascript
const Job = require("../models/Job");
const { v2: cloudinary } = require("cloudinary");
const {
  sendEmail,
  formatEmailBody,
  createEmailTemplate,
} = require("../utils/sendEmail");

const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const cloudKey = (process.env.CLOUDINARY_API_KEY || "").trim();
const cloudSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
const HR_EMAIL = (process.env.HR_EMAIL || "hr@edenhire.ai").trim();

if (!cloudName || !cloudKey || !cloudSecret) {
  console.warn("Cloudinary env vars missing or empty; resume uploads may fail.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: cloudKey,
  api_secret: cloudSecret,
});

/**
 * Upload resume to Cloudinary
 * @param {Buffer} fileBuffer - Resume file buffer
 * @returns {Promise<Object>} Cloudinary response with secure_url
 */
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
    const uploadedResume = await uploadResume(req.file.buffer);
    const resumeUrl = uploadedResume.secure_url;
    console.log("[CLOUDINARY] Upload successful", {
      resumeUrl,
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
    });
    console.log("[DB] Job saved successfully", {
      id: job._id,
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
```

---

## File 4: .env Configuration

```env
PORT=5000

MONGO_URI=mongodb+srv://edenadmin:Eden12345@cluster0.xiwo44f.mongodb.net/edenhires?retryWrites=true&w=majority&appName=Cluster0

CLOUDINARY_CLOUD_NAME=mediaflows_903213c7-49b7-45af-b947-abaceb350a24
CLOUDINARY_API_KEY=981424132692523
CLOUDINARY_API_SECRET=ZC4nPxOje5qVh5T1LsjUnn_bl9M

# Email Configuration (Hostinger)
EMAIL_USER=hr@edenhire.ai
EMAIL_PASS=HREdenhire@2026#
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true

# Email Recipients
HR_EMAIL=hr@edenhire.ai
SALES_EMAIL=sales@edenhire.ai
```

---

## Key Improvements Summary

| Aspect | Before | After |
|--------|--------|-------|
| Email Format | Plain text | Professional HTML tables |
| Error Handling | Blocks on email failure | Email failure doesn't block response |
| Logging | Basic logging | Structured logs with timestamps |
| Email Recipients | Hardcoded | Environment variables |
| Field Display | Unformatted text | Labeled table format |
| SMTP Verification | None | Verified at startup |
| Documentation | None | Comprehensive guides |
| Code Organization | Single function | Modular, reusable functions |
| Field Validation | Minimal | Complete field validation |
| Response Messages | Generic | User-friendly messages |
