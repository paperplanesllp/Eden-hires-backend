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
