const nodemailer = require("nodemailer");

const emailUser = (process.env.EMAIL_USER || "").trim();
const emailPass = (process.env.EMAIL_PASS || "").trim();

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  await transporter.sendMail({
    from: emailUser,
    to,
    subject,
    text,
    html,
    replyTo,
  });
};

module.exports = sendEmail;
