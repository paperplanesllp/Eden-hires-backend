const Contact = require("../models/Contact");
const sendEmail = require("../utils/sendEmail");

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
  try {
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

    await sendEmail({
      to: "sales@edenhire.ai",
      subject: "New Hiring Inquiry",
      replyTo: email,
      text: buildHiringEmail(contact),
    });

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createContact,
};
