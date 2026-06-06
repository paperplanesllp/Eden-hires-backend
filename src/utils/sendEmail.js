const nodemailer = require("nodemailer");

const emailUser = (process.env.EMAIL_USER || "").trim();
const emailPass = (process.env.EMAIL_PASS || "").trim();

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
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