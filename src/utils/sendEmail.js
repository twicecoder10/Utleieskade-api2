const nodemailer = require("nodemailer");

async function sendEmail(email, subject, text) {
  try {
    // Check if email configuration is set
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("Email configuration missing:", {
        EMAIL_HOST: !!process.env.EMAIL_HOST,
        EMAIL_USER: !!process.env.EMAIL_USER,
        EMAIL_PASSWORD: !!process.env.EMAIL_PASSWORD,
      });
      throw new Error("Email service is not configured. Please contact support.");
    }

    const emailPort = parseInt(process.env.EMAIL_PORT || "465", 10);
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      // Add connection timeout
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: text,
    });
    console.log("Email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error(`Email failed to send to ${email}, Error:`, error.message);
    console.error(`Email error details:`, {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      errorMessage = "Email server connection failed. Please check email configuration.";
    } else if (error.responseCode === 535) {
      errorMessage = "Email authentication failed. Please check email credentials.";
    } else if (error.responseCode === 550) {
      errorMessage = "Email address rejected by server.";
    }
    
    throw new Error(errorMessage);
  }
}

module.exports = sendEmail;
