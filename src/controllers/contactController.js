const Contact = require("../models/Contact");
const { sendEmail } = require("../utils/sendEmail");

const buildHiringEmail = (contact) => `
New hiring inquiry

Name: ${contact.name}
Company: ${contact.company}
Email: ${contact.email}
Phone: ${contact.phone}
Role Hiring For: ${contact.role}
Team Size: ${contact.teamSize}
Funding Stage: ${contact.fundingStage}
Hiring Challenge: ${contact.challenge}
`;

const createContact = async (req, res) => {
  console.log("[START] createContact - Request received");
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
    console.log("[DB] Contact saved successfully", { id: contact._id });

    console.log("[EMAIL] Attempting to send email to sales@edenhire.ai");
    await sendEmail({
      to: "sales@edenhire.ai",
      subject: "New Hiring Inquiry",
      replyTo: email,
      text: buildHiringEmail(contact),
    });
    console.log("[EMAIL] Email sent successfully to sales@edenhire.ai");

    console.log("[STEP] Response returning");
    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("[ERROR]", error);
    console.error("[ERROR MESSAGE]", error.message);
    console.error("[STACK]", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createContact,
};
