# Complete Updated sendEmail.js - Resend Version

**File Location**: `/src/utils/sendEmail.js`

```javascript
const { Resend } = require("resend");

// Configuration from environment variables
const resendApiKey = (process.env.RESEND_API_KEY || "").trim();

const FROM_EMAIL = "noreply@edenhire.ai";
const FROM_NAME = "Eden Hire";

// Validate Resend configuration
if (!resendApiKey) {
  console.error("[EMAIL CONFIG] RESEND_API_KEY is missing");
}

console.log("[EMAIL CONFIG]", {
  provider: "Resend",
  apiKeyConfigured: !!resendApiKey,
  fromEmail: FROM_EMAIL,
  fromName: FROM_NAME,
  timestamp: new Date().toISOString(),
});

// Initialize Resend client
const resend = new Resend(resendApiKey);

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
 * Send email using Resend API with error handling and logging
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body (fallback)
 * @param {string} options.html - HTML body
 * @param {string} options.replyTo - Reply-to email address
 * @returns {Promise<Object>} Resend response info
 * @throws {Error} Throws error if API key is missing or request fails
 */
const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  try {
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    console.log("[EMAIL] Sending email via Resend", {
      to,
      subject,
      replyTo,
      timestamp: new Date().toISOString(),
    });

    const mailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
      ...(replyTo ? { replyTo } : {}),
    };

    const response = await resend.emails.send(mailOptions);

    // Check for errors in response
    if (response.error) {
      throw new Error(response.error.message || "Email send failed");
    }

    console.log("[EMAIL] Email sent successfully via Resend", {
      id: response.data?.id,
      to,
      subject,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error) {
    console.error("[EMAIL ERROR]", {
      message: error.message,
      code: error.code,
      provider: "Resend",
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
};

/**
 * Verify Resend API configuration and connectivity
 * Adapted for Resend: Tests API key presence and basic connectivity
 * @returns {Promise<boolean>} Returns true if configuration is valid
 */
const verifyTransporter = async () => {
  try {
    console.log("[EMAIL] Verifying Resend API configuration...");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    console.log("[EMAIL] Resend API key is configured and verified");

    return true;
  } catch (error) {
    console.error("[EMAIL] Resend API verification failed", {
      message: error.message,
      timestamp: new Date().toISOString(),
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

## Key Differences from Nodemailer Version

| Aspect | Nodemailer | Resend |
|--------|-----------|--------|
| **Import** | `const nodemailer = require("nodemailer");` | `const { Resend } = require("resend");` |
| **API Key** | `EMAIL_USER`, `EMAIL_PASS`, SMTP host/port | Single `RESEND_API_KEY` |
| **Initialization** | `nodemailer.createTransport()` | `new Resend(apiKey)` |
| **Send Method** | `transporter.sendMail()` | `resend.emails.send()` |
| **Response** | `{ messageId, response }` | `{ data: { id }, error }` |
| **From Address** | Variable + hardcoded | Constant (`noreply@edenhire.ai`) |
| **Verification** | SMTP connection test | API key presence check |

---

## Environment Variable Change

### Before (Nodemailer - Removed)
```env
EMAIL_USER=hr@edenhire.ai
EMAIL_PASS=HREdenhire@2026#
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
```

### After (Resend - Required)
```env
RESEND_API_KEY=re_your_actual_api_key_here
```

---

## No Controller Changes Needed

The following files work **exactly as before** with no modifications:
- `/src/controllers/contactController.js`
- `/src/controllers/jobController.js`
- `/src/routes/contactRoutes.js`
- `/src/routes/jobRoutes.js`

This is because all exported functions maintain the same interface.

---

## Installation

```bash
npm install resend
```

Then add `RESEND_API_KEY` to your `.env` file and restart the server.
