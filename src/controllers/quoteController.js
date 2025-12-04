const QuoteRequest = require('../models/QuoteRequest');
const QuotationHistory = require('../models/QuotationHistory');
const emailService = require('../services/emailService');

exports.createQuote = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      numberOfDays,
      busType,
      numberOfPassengers,
      departureDate,
      specialRequests
    } = req.body;

    if (!pickupLocation || !dropoffLocation || !numberOfDays || !busType || !numberOfPassengers || !departureDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const maxCapacity = busType === '49-seater' ? 49 : 60;
    if (numberOfPassengers > maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Number of passengers (${numberOfPassengers}) exceeds bus capacity (${maxCapacity})`
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const departure = new Date(departureDate);
    if (departure < today) {
      return res.status(400).json({
        success: false,
        message: 'Departure date must be today or in the future'
      });
    }

    const quoteRequest = await QuoteRequest.create({
      user: req.user._id,
      pickupLocation,
      dropoffLocation,
      numberOfDays,
      busType,
      numberOfPassengers,
      departureDate,
      specialRequests: specialRequests || ''
    });

    await quoteRequest.populate('user', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      data: quoteRequest
    });
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating quote request'
    });
  }
};

exports.getMyQuotes = async (req, res) => {
  try {
    const quotes = await QuoteRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email');

    res.status(200).json({
      success: true,
      count: quotes.length,
      data: quotes
    });
  } catch (error) {
    console.error('Get my quotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your quote requests'
    });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const quote = await QuoteRequest.findById(req.params.id)
      .populate('user', 'firstName lastName email phone');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote request not found'
      });
    }

    if (quote.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this quote request'
      });
    }

    res.status(200).json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Get quote by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quote request'
    });
  }
};

exports.getAllQuotes = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const quotes = await QuoteRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      count: quotes.length,
      data: quotes
    });
  } catch (error) {
    console.error('Get all quotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quote requests'
    });
  }
};

exports.updateQuote = async (req, res) => {
  try {
    const { status, estimatedPrice, adminNotes } = req.body;

    const quote = await QuoteRequest.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote request not found'
      });
    }

    if (status) quote.status = status;
    if (estimatedPrice !== undefined) quote.estimatedPrice = estimatedPrice;
    if (adminNotes !== undefined) quote.adminNotes = adminNotes;

    await quote.save();
    await quote.populate('user', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      message: 'Quote request updated successfully',
      data: quote
    });
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating quote request'
    });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const quote = await QuoteRequest.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote request not found'
      });
    }

    await quote.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quote request deleted successfully'
    });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting quote request'
    });
  }
};

/**
 * ═══════════════════════════════════════════════════════════
 * SUBMIT QUOTATION - Enterprise-Level Email Functionality
 * ═══════════════════════════════════════════════════════════
 *
 * This is the main endpoint where admin sends the quotation to customer.
 *
 * WHAT HAPPENS:
 * 1. Validate the quote exists
 * 2. Update quote status to 'quoted'
 * 3. Save the price and admin notes
 * 4. Create audit trail entry
 * 5. Send email to customer
 * 6. Create another audit entry for email
 * 7. Return success response
 *
 * ENTERPRISE FEATURES:
 * - Transaction-like behavior (if email fails, we still save the data)
 * - Audit logging for compliance
 * - Error handling at each step
 * - Detailed logging for debugging
 */
exports.submitQuotation = async (req, res) => {
  try {
    const { estimatedPrice, adminNotes } = req.body;

    // STEP 1: VALIDATION
    // Ensure required data is provided
    if (!estimatedPrice || estimatedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid estimated price'
      });
    }

    // STEP 2: FIND QUOTE
    // Get the quote and populate user information (we need email)
    const quote = await QuoteRequest.findById(req.params.id)
      .populate('user', 'firstName lastName email phone');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote request not found'
      });
    }

    // STEP 3: STORE PREVIOUS STATE (for audit trail)
    const previousState = {
      status: quote.status,
      estimatedPrice: quote.estimatedPrice,
      adminNotes: quote.adminNotes
    };

    // STEP 4: UPDATE QUOTE
    // Change status to 'quoted' and save price/notes
    quote.status = 'quoted';
    quote.estimatedPrice = estimatedPrice;
    quote.adminNotes = adminNotes || quote.adminNotes;

    await quote.save();

    // STEP 5: CREATE AUDIT TRAIL - Price Update
    // Log that admin updated the price
    await QuotationHistory.createEntry({
      quoteId: quote._id,
      userId: req.user._id,
      action: 'price_updated',
      previousState: previousState,
      newState: {
        status: quote.status,
        estimatedPrice: quote.estimatedPrice,
        adminNotes: quote.adminNotes
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        comment: 'Admin submitted quotation'
      }
    });

    // STEP 6: SEND EMAIL
    // Use the email service to send quotation email
    console.log('[Quote] Sending quotation email to customer...');

    const emailResult = await emailService.sendQuotationEmail({
      to: quote.user.email,
      customerName: quote.user.getFullName(),
      quoteNumber: quote.quoteNumber,
      quoteDetails: {
        pickupLocation: quote.pickupLocation,
        dropoffLocation: quote.dropoffLocation,
        departureDate: quote.departureDate,
        numberOfDays: quote.numberOfDays,
        busType: quote.busType,
        numberOfPassengers: quote.numberOfPassengers
      },
      price: estimatedPrice,
      adminNotes: adminNotes
    });

    // STEP 7: CREATE AUDIT TRAIL - Email Sent
    // Log the email sending attempt
    await QuotationHistory.createEntry({
      quoteId: quote._id,
      userId: req.user._id,
      action: 'email_sent',
      previousState: {},
      newState: {},
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        emailStatus: emailResult.success ? 'success' : 'failed',
        emailMessageId: emailResult.messageId || null,
        comment: emailResult.success
          ? 'Quotation email sent successfully'
          : `Email failed: ${emailResult.message || 'Unknown error'}`
      }
    });

    // STEP 8: PREPARE RESPONSE
    // Different response based on email success
    if (emailResult.success) {
      console.log('[Quote] Quotation submitted and email sent successfully');

      res.status(200).json({
        success: true,
        message: 'Quotation submitted and email sent successfully',
        data: {
          quote: quote,
          emailSent: true,
          emailMessageId: emailResult.messageId
        }
      });
    } else {
      // Email failed but quote was updated
      // This is important: we still save the quote even if email fails
      console.error('[Quote] Quote updated but email failed:', emailResult.message);

      res.status(200).json({
        success: true,
        message: 'Quotation saved but email delivery failed. Please contact the customer directly.',
        data: {
          quote: quote,
          emailSent: false,
          emailError: emailResult.message
        },
        warning: 'Email was not delivered. Please follow up manually.'
      });
    }

  } catch (error) {
    // STEP 9: ERROR HANDLING
    // Log the error and return appropriate response
    console.error('[Quote] Submit quotation error:', error);

    res.status(500).json({
      success: false,
      message: 'Error submitting quotation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ═══════════════════════════════════════════════════════════
 * GET QUOTATION CALENDAR EVENTS
 * ═══════════════════════════════════════════════════════════
 *
 * Returns quotations formatted for calendar display.
 * Filters by date range to optimize performance.
 *
 * RESPONSE FORMAT:
 * {
 *   id: quote._id,
 *   title: "Customer Name - Quote Request",
 *   start: departureDate,
 *   end: departureDate,
 *   resource: {
 *     type: 'quotation',
 *     status: quote.status,
 *     quote: full quote object
 *   }
 * }
 */
exports.getQuoteCalendarEvents = async (req, res) => {
  try {
    const { start, end } = req.query;

    // Build date filter if provided
    const filter = {};
    if (start && end) {
      filter.departureDate = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    // Fetch quotes within date range
    const quotes = await QuoteRequest.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort({ departureDate: 1 });

    // Transform to calendar event format
    const events = quotes.map(quote => ({
      id: quote._id,
      title: `${quote.user.firstName} ${quote.user.lastName} - Quote Request`,
      start: new Date(quote.departureDate),
      end: new Date(quote.departureDate),
      resource: {
        type: 'quotation',
        status: quote.status,
        estimatedPrice: quote.estimatedPrice,
        quote: quote
      }
    }));

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error('[Quote] Get calendar events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quote calendar events'
    });
  }
};
