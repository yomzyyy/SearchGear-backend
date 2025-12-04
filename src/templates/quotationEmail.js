/**
 * ═══════════════════════════════════════════════════════════
 * QUOTATION EMAIL TEMPLATE
 * ═══════════════════════════════════════════════════════════
 *
 * This creates professional HTML emails for quotations.
 *
 * WHY HTML EMAILS?
 * - Plain text emails look unprofessional
 * - HTML allows branding, formatting, and better UX
 * - Most email clients support HTML
 *
 * BEST PRACTICES:
 * - Use inline CSS (email clients strip <style> tags)
 * - Use tables for layout (flexbox doesn't work in emails)
 * - Keep it simple (complex CSS often breaks)
 * - Always include a plain text fallback
 */

/**
 * Generate Quotation Email HTML
 *
 * @param {Object} data - Quote data
 * @param {Object} data.quote - The quote request object
 * @param {Object} data.user - The customer user object
 * @param {number} data.price - The quoted price
 * @param {string} data.adminNotes - Additional notes from admin
 * @returns {string} HTML email content
 */
const generateQuotationEmail = ({ quote, user, price, adminNotes }) => {
  // Format date nicely
  const departureDate = new Date(quote.departureDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format price with commas and currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);

  // Calculate total price (days * daily rate)
  const totalPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price * quote.numberOfDays);

  // HTML EMAIL STRUCTURE
  // We use tables because they're the most reliable in email clients
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quotation from SearchGear</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">

  <!-- MAIN CONTAINER -->
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">

        <!-- EMAIL CONTENT BOX -->
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- HEADER (Brand Color) -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                SearchGear Tours
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                Your Journey, Our Priority
              </p>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding: 40px 30px 20px 30px;">
              <h2 style="margin: 0 0 10px 0; color: #333333; font-size: 24px;">
                Hello ${user.firstName}!
              </h2>
              <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Thank you for your quote request. We're excited to provide you with the following quotation:
              </p>
            </td>
          </tr>

          <!-- QUOTATION NUMBER -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; border-radius: 4px;">
                <p style="margin: 0; color: #667eea; font-weight: bold; font-size: 14px;">
                  QUOTATION NUMBER
                </p>
                <p style="margin: 5px 0 0 0; color: #333333; font-size: 20px; font-weight: bold;">
                  ${quote.quoteNumber}
                </p>
              </div>
            </td>
          </tr>

          <!-- TRIP DETAILS -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">
                Trip Details
              </h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <!-- Pickup Location -->
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                    <span style="color: #999999; font-size: 14px;">Pickup Location</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">
                    <span style="color: #333333; font-size: 14px; font-weight: 600;">
                      ${quote.pickupLocation}
                    </span>
                  </td>
                </tr>

                <!-- Dropoff Location -->
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                    <span style="color: #999999; font-size: 14px;">Drop-off Location</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">
                    <span style="color: #333333; font-size: 14px; font-weight: 600;">
                      ${quote.dropoffLocation}
                    </span>
                  </td>
                </tr>

                <!-- Departure Date -->
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                    <span style="color: #999999; font-size: 14px;">Departure Date</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">
                    <span style="color: #333333; font-size: 14px; font-weight: 600;">
                      ${departureDate}
                    </span>
                  </td>
                </tr>

                <!-- Duration -->
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                    <span style="color: #999999; font-size: 14px;">Duration</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">
                    <span style="color: #333333; font-size: 14px; font-weight: 600;">
                      ${quote.numberOfDays} day${quote.numberOfDays > 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>

                <!-- Bus Type -->
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                    <span style="color: #999999; font-size: 14px;">Bus Type</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">
                    <span style="color: #333333; font-size: 14px; font-weight: 600;">
                      ${quote.busType}
                    </span>
                  </td>
                </tr>

                <!-- Passengers -->
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                    <span style="color: #999999; font-size: 14px;">Number of Passengers</span>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">
                    <span style="color: #333333; font-size: 14px; font-weight: 600;">
                      ${quote.numberOfPassengers} passengers
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PRICING -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                  DAILY RATE
                </p>
                <p style="margin: 10px 0; color: #ffffff; font-size: 36px; font-weight: bold;">
                  ${formattedPrice}
                </p>
                <p style="margin: 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                  per day
                </p>
                <div style="margin: 20px 0; height: 1px; background-color: rgba(255,255,255,0.3);"></div>
                <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                  Total for ${quote.numberOfDays} day${quote.numberOfDays > 1 ? 's' : ''}
                </p>
                <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                  ${totalPrice}
                </p>
              </div>
            </td>
          </tr>

          ${adminNotes ? `
          <!-- ADMIN NOTES -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #fff9e6; border-left: 4px solid #ffc107; padding: 15px 20px; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #856404; font-weight: bold; font-size: 14px;">
                  ADDITIONAL NOTES
                </p>
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  ${adminNotes}
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- CALL TO ACTION -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard/quotes"
                 style="display: inline-block; padding: 15px 40px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                View Full Quotation
              </a>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px;">
                Or contact us if you have any questions
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                SearchGear Tours | Premium Bus Charter Services
              </p>
              <p style="margin: 0 0 15px 0; color: #999999; font-size: 12px;">
                Questions? Email us at <a href="mailto:support@searchgear.com" style="color: #667eea; text-decoration: none;">support@searchgear.com</a>
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                This quotation is valid for 30 days from the date of issue.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
};

/**
 * Generate Plain Text Version
 *
 * WHY PLAIN TEXT?
 * - Some email clients don't support HTML
 * - Email filters prefer emails with both HTML and plain text
 * - Accessibility for screen readers
 */
const generatePlainTextQuotation = ({ quote, user, price, adminNotes }) => {
  const departureDate = new Date(quote.departureDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);

  const totalPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price * quote.numberOfDays);

  return `
SEARCHGEAR TOURS - QUOTATION

Hello ${user.firstName}!

Thank you for your quote request. We're excited to provide you with the following quotation:

QUOTATION NUMBER: ${quote.quoteNumber}

TRIP DETAILS:
- Pickup Location: ${quote.pickupLocation}
- Drop-off Location: ${quote.dropoffLocation}
- Departure Date: ${departureDate}
- Duration: ${quote.numberOfDays} day${quote.numberOfDays > 1 ? 's' : ''}
- Bus Type: ${quote.busType}
- Number of Passengers: ${quote.numberOfPassengers}

PRICING:
Daily Rate: ${formattedPrice}/day
Total for ${quote.numberOfDays} day${quote.numberOfDays > 1 ? 's' : ''}: ${totalPrice}

${adminNotes ? `ADDITIONAL NOTES:\n${adminNotes}\n` : ''}

View your full quotation at: ${process.env.FRONTEND_URL}/dashboard/quotes

Questions? Contact us at support@searchgear.com

This quotation is valid for 30 days from the date of issue.

---
SearchGear Tours | Premium Bus Charter Services
  `.trim();
};

module.exports = {
  generateQuotationEmail,
  generatePlainTextQuotation
};
