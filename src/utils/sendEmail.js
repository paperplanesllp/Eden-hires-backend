const nodemailer = require("nodemailer");

const emailUser = (process.env.EMAIL_USER || "").trim();
const emailPass = (process.env.EMAIL_PASS || "").trim();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  console.log("[EMAIL] Attempting to send email", { to, subject, replyTo });
  try {
    const info = await transporter.sendMail({
      from: emailUser,
      to,
      subject,
      text,
      html,
      replyTo,
    });

    console.log("[EMAIL] Email sent successfully", { to, messageId: info && info.messageId });
    return info;
  } catch (error) {
    console.error("[ERROR]", error);
    console.error("[ERROR MESSAGE]", error.message);
    console.error("[STACK]", error.stack);
    throw error;
  }
};

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log("[EMAIL] SMTP connection successful");
  } catch (error) {
    console.error("[EMAIL] SMTP connection failed:", error);
    throw error;
  }
};

module.exports = { sendEmail, verifyTransporter };