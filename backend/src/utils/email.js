const nodemailer = require('nodemailer');
const logger = require('./logger');

const host = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
const port = parseInt(process.env.EMAIL_PORT || '2525', 10);
const user = process.env.EMAIL_USER;
const password = process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  host,
  port,
  auth: user && password ? { user, pass: password } : undefined
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!to) {
      logger.warn('Skipping email send: No recipient address provided.');
      return null;
    }
    
    // If not configured, mock by logging to winston to ensure robust local running
    if (!user || !password || user === 'test_user' || password === 'test_password') {
      logger.info(`[Email Mocked - Credentials Missing] To: ${to} | Subject: ${subject}`);
      logger.info(`Body: ${text || html}`);
      return { messageId: 'mock-id-' + Date.now() };
    }

    const info = await transporter.sendMail({
      from: `"HRMS Admin" <${user}>`,
      to,
      subject,
      text,
      html
    });

    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    // Return null and swallow the error to prevent application failure
    return null;
  }
};

module.exports = { sendEmail };
