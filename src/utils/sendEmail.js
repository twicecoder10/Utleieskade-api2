const nodemailer = require("nodemailer");

async function sendEmail(email, subject, text) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // tls: {
      //     rejectUnauthorized: false
      // },
      // logger: true,
      // debug: true,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: text,
    });
    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.log(`Email failed to send, Error: ${error}`);
    throw error;
  }
}

module.exports = sendEmail;
