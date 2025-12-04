/**
 * ═══════════════════════════════════════════════════════════
 * EMAIL CONFIGURATION
 * ═══════════════════════════════════════════════════════════
 *
 * This file configures Nodemailer to send emails.
 *
 * WHAT IS NODEMAILER?
 * - It's a library that sends emails from Node.js
 * - Like having a mail carrier for your application
 *
 * HOW IT WORKS:
 * 1. We create a "transporter" (the mail carrier)
 * 2. We give it SMTP credentials (like a mailbox key)
 * 3. We use it to send emails throughout our app
 *
 * SMTP EXPLAINED:
 * - SMTP = Simple Mail Transfer Protocol
 * - It's the standard way to send emails on the internet
 * - Every email provider (Gmail, Outlook, etc.) has an SMTP server
 */

const nodemailer = require('nodemailer');

/**
 * Create Email Transporter
 *
 * TRANSPORTER = The object that actually sends emails
 *
 * We configure it differently for:
 * - DEVELOPMENT: Use fake email service (logs to console)
 * - PRODUCTION: Use real email service (Gmail, SendGrid, etc.)
 */
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // PRODUCTION CONFIGURATION
    // Use real SMTP server
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,      // Example: smtp.gmail.com
      port: process.env.SMTP_PORT || 587, // 587 = standard SMTP port
      secure: false,                     // false for port 587, true for 465
      auth: {
        user: process.env.SMTP_USER,   // Your email: noreply@yourcompany.com
        pass: process.env.SMTP_PASS    // Your email password or app password
      },
      // TIMEOUTS (prevent hanging if server is slow)
      connectionTimeout: 5000,  // Wait 5 seconds to connect
      greetingTimeout: 5000,    // Wait 5 seconds for server greeting
      socketTimeout: 10000      // Wait 10 seconds for responses
    });
  } else {
    // DEVELOPMENT CONFIGURATION
    // Use Ethereal (fake SMTP for testing)
    // Emails won't actually send - they'll be logged to console
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'testpassword'
      }
    });
  }
};

// Create the transporter instance
const transporter = createTransporter();

/**
 * Verify Connection
 *
 * This tests if the email server is reachable.
 * Like checking if the mail carrier is available before sending a letter.
 *
 * WHY DO THIS?
 * - Fail fast if misconfigured
 * - Provide helpful error messages during development
 */
transporter.verify((error, success) => {
  if (error) {
    console.error('[Email] Configuration error:', error.message);
    console.log('[Email] Service will be unavailable. Check your .env file SMTP settings');
  } else {
    console.log('[Email] Service is ready to send messages');
  }
});

// Export so other files can use this transporter
module.exports = transporter;
