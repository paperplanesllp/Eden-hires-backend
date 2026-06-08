const nodemailer = require("nodemailer");

const emailUser = (process.env.EMAIL_USER || "").trim();
const emailPass = (process.env.EMAIL_PASS || "").trim();

const smtpHost = (process.env.SMTP_HOST || "smtp.hostinger.com").trim();
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure =
  process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465;

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

const sendEmail = async ({
  to,
  subject,
  text,
  html,
  replyTo,
}) => {
  try {
    if (!emailUser || !emailPass) {
      throw new Error(
        "EMAIL_USER or EMAIL_PASS is not configured"
      );
    }

    console.log("[EMAIL] Sending email", {
      to,
      subject,
      replyTo,
    });

    const info = await transporter.sendMail({
      from: `"Eden Hire" <${emailUser}>`,
      to,
      subject,
      text,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    console.log("[EMAIL] Email sent successfully", {
      messageId: info.messageId,
      response: info.response,
    });

    return info;
  } catch (error) {
    console.error("[EMAIL ERROR]", {
      message: error.message,
      code: error.code,
      command: error.command,
    });

    throw error;
  }
};

const verifyTransporter = async () => {
  try {
    console.log("[EMAIL] Verifying SMTP connection...");

    await transporter.verify();

    console.log("[EMAIL] SMTP connection successful");

    return true;
  } catch (error) {
    console.error("[EMAIL] SMTP verification failed", {
      message: error.message,
      code: error.code,
      command: error.command,
    });

    return false;
  }
};

module.exports = {
  sendEmail,
  verifyTransporter,
};