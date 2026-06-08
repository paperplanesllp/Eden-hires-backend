/**
 * Verify SMTP transporter connection
 * @returns {Promise<boolean>}
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

    throw error;
  }
};