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