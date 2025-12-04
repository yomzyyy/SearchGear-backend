const nodemailer = require('nodemailer');

/**
 * EmailService - Enterprise-level email handling
 *
 * This service handles all email operations in the application.
 * It's designed to be:
 * - Configurable: Easy to switch email providers
 * - Reusable: Can send different types of emails
 * - Testable: Separate logic from controllers
 * - Maintainable: Centralized email logic
 */

class EmailService {
  constructor() {
    // Create a reusable transporter object using SMTP
    // This is the "mail server" configuration
    this.transporter = nodemailer.createTransport({
      // Using Gmail as an example (you can change this to any SMTP service)
      service: process.env.EMAIL_SERVICE || 'gmail',

      // Authentication credentials
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD, // App-specific password (NOT your regular password!)
      },

      // Additional options for production
      pool: true, // Use pooled connections for better performance
      maxConnections: 5, // Maximum simultaneous connections
      maxMessages: 100, // Maximum messages per connection
    });

    // Verify the connection on startup
    this.verifyConnection();
  }

  /**
   * Verify email service connection
   * This runs when the server starts to catch configuration errors early
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('[Email] Service is ready to send messages');
    } catch (error) {
      console.error('[Email] Service error:', error.message);
      console.error('[Email] Please check your EMAIL_USER and EMAIL_PASSWORD in .env file');
    }
  }

  /**
   * Send a quotation email to a customer
   *
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.customerName - Customer's full name
   * @param {string} options.quoteNumber - Quote reference number (e.g., "QR-A1B2C3D4")
   * @param {Object} options.quoteDetails - Quote information
   * @param {number} options.price - Quoted price
   * @param {string} options.adminNotes - Optional notes from admin
   * @returns {Promise} - Resolves when email is sent
   */
  async sendQuotationEmail({
    to,
    customerName,
    quoteNumber,
    quoteDetails,
    price,
    adminNotes = ''
  }) {
    try {
      // Format the price with proper currency
      const formattedPrice = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(price);

      // Format the departure date
      const departureDate = new Date(quoteDetails.departureDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // HTML email template (professional looking)
      // In production, companies use services like SendGrid with pre-made templates
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .quote-box {
              background-color: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .quote-number {
              font-size: 24px;
              font-weight: bold;
              color: #667eea;
              margin-bottom: 10px;
            }
            .price {
              font-size: 32px;
              font-weight: bold;
              color: #28a745;
              margin: 20px 0;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .details-table td {
              padding: 12px;
              border-bottom: 1px solid #dee2e6;
            }
            .details-table td:first-child {
              font-weight: bold;
              color: #666;
              width: 40%;
            }
            .notes-box {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <h1>SearchGear</h1>
              <p>Your Bus Charter Quotation</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p>Dear ${customerName},</p>

              <p>Thank you for your interest in our bus charter services. We're pleased to provide you with a quotation for your upcoming trip.</p>

              <!-- Quote Number -->
              <div class="quote-box">
                <div class="quote-number">Quote #${quoteNumber}</div>
                <p style="margin: 5px 0; color: #666;">Valid for 30 days from the date of issue</p>
              </div>

              <!-- Price -->
              <div style="text-align: center;">
                <p style="margin: 5px 0; color: #666;">Total Price</p>
                <div class="price">${formattedPrice}</div>
              </div>

              <!-- Trip Details -->
              <table class="details-table">
                <tr>
                  <td>Pickup Location:</td>
                  <td>${quoteDetails.pickupLocation}</td>
                </tr>
                <tr>
                  <td>Drop-off Location:</td>
                  <td>${quoteDetails.dropoffLocation}</td>
                </tr>
                <tr>
                  <td>Departure Date:</td>
                  <td>${departureDate}</td>
                </tr>
                <tr>
                  <td>Number of Days:</td>
                  <td>${quoteDetails.numberOfDays} day(s)</td>
                </tr>
                <tr>
                  <td>Bus Type:</td>
                  <td>${quoteDetails.busType}</td>
                </tr>
                <tr>
                  <td>Number of Passengers:</td>
                  <td>${quoteDetails.numberOfPassengers} passengers</td>
                </tr>
              </table>

              ${adminNotes ? `
                <!-- Admin Notes -->
                <div class="notes-box">
                  <strong>Additional Information:</strong>
                  <p style="margin: 10px 0 0 0;">${adminNotes.replace(/\n/g, '<br>')}</p>
                </div>
              ` : ''}

              <!-- What's Included -->
              <div style="margin: 30px 0;">
                <h3 style="color: #667eea;">What's Included:</h3>
                <ul style="color: #666;">
                  <li>Professional and experienced driver</li>
                  <li>Fuel costs for the entire journey</li>
                  <li>Toll fees and parking charges</li>
                  <li>Vehicle insurance coverage</li>
                  <li>24/7 customer support during your trip</li>
                </ul>
              </div>

              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <p>Ready to confirm your booking?</p>
                <a href="mailto:${process.env.EMAIL_USER}?subject=Booking Confirmation - ${quoteNumber}" class="button">
                  Confirm Booking
                </a>
              </div>

              <p>If you have any questions or would like to discuss this quotation, please don't hesitate to contact us.</p>

              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The SearchGear Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p><strong>SearchGear Bus Charter Services</strong></p>
              <p>Phone: +63 XXX XXX XXXX | Email: ${process.env.EMAIL_USER}</p>
              <p style="font-size: 12px; margin-top: 15px;">
                This quotation is valid for 30 days. Prices are subject to availability and may change based on specific requirements.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Plain text version (fallback for email clients that don't support HTML)
      const textContent = `
Dear ${customerName},

Thank you for your interest in SearchGear Bus Charter Services.

QUOTATION: ${quoteNumber}
---------------------------
Total Price: ${formattedPrice}

TRIP DETAILS:
- Pickup: ${quoteDetails.pickupLocation}
- Drop-off: ${quoteDetails.dropoffLocation}
- Departure: ${departureDate}
- Duration: ${quoteDetails.numberOfDays} day(s)
- Bus Type: ${quoteDetails.busType}
- Passengers: ${quoteDetails.numberOfPassengers}

${adminNotes ? `\nADDITIONAL INFORMATION:\n${adminNotes}\n` : ''}

WHAT'S INCLUDED:
- Professional driver
- Fuel costs
- Toll fees and parking
- Vehicle insurance
- 24/7 customer support

To confirm your booking, please reply to this email or contact us at ${process.env.EMAIL_USER}.

Best regards,
The SearchGear Team
      `.trim();

      // Send the email
      const info = await this.transporter.sendMail({
        from: `"SearchGear" <${process.env.EMAIL_USER}>`, // Sender address
        to, // Recipient address
        subject: `Your Bus Charter Quotation - ${quoteNumber}`, // Subject line
        text: textContent, // Plain text body
        html: htmlContent, // HTML body

        // Additional headers for better deliverability
        headers: {
          'X-Priority': '1', // High priority
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      });

      // Log success (in production, you'd log this to a database)
      console.log('[Email] Quotation email sent successfully');
      console.log('[Email] Message ID:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        message: 'Quotation email sent successfully'
      };

    } catch (error) {
      // Log error (in production, use a proper logging service like Winston)
      console.error('[Email] Error sending quotation email:', error);

      throw new Error(`Failed to send quotation email: ${error.message}`);
    }
  }

  /**
   * Send a generic notification email
   * This can be used for other purposes (password reset, booking confirmation, etc.)
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"SearchGear" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('[Email] Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

// Export a singleton instance
// This means we only create one EmailService instance for the entire app
// This is efficient because we don't need to create a new connection for each email
module.exports = new EmailService();
