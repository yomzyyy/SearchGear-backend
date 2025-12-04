/**
 * BOOKING CONTROLLER
 *
 * Handles all booking-related operations:
 * - Get all bookings
 * - Get calendar events
 * - Get booking by ID
 * - Create booking from quotation
 * - Update booking status
 * - Mark as paid
 * - Cancel booking
 */

const Booking = require('../models/Booking');
const QuoteRequest = require('../models/QuoteRequest');

/**
 * GET ALL BOOKINGS
 * Admin can view all bookings with filters
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { status, paymentStatus, bookingType, startDate, endDate } = req.query;

    // BUILD QUERY FILTER
    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (bookingType) filter.bookingType = bookingType;

    // DATE RANGE FILTER
    if (startDate && endDate) {
      filter.departureDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('quoteRequest')
      .sort({ departureDate: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('[Booking] Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
};

/**
 * GET CALENDAR EVENTS
 * Returns bookings formatted for calendar display
 */
exports.getCalendarEvents = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Start and end dates are required'
      });
    }

    const events = await Booking.getCalendarEvents(
      new Date(start),
      new Date(end)
    );

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('[Booking] Get calendar events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar events'
    });
  }
};

/**
 * GET BOOKING BY ID
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('quoteRequest')
      .populate('cancelledBy', 'firstName lastName');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('[Booking] Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking'
    });
  }
};

/**
 * CREATE BOOKING FROM QUOTATION
 * When a quotation is approved, create a booking
 */
exports.createBookingFromQuotation = async (req, res) => {
  try {
    const { quoteRequestId } = req.body;

    // FIND THE QUOTE REQUEST
    const quote = await QuoteRequest.findById(quoteRequestId)
      .populate('user');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote request not found'
      });
    }

    // CHECK IF QUOTE IS APPROVED
    if (quote.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Quote must be approved before creating booking'
      });
    }

    // CHECK IF BOOKING ALREADY EXISTS
    const existingBooking = await Booking.findOne({ quoteRequest: quoteRequestId });
    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Booking already exists for this quotation'
      });
    }

    // CREATE BOOKING
    const booking = await Booking.create({
      quoteRequest: quote._id,
      user: quote.user._id,
      pickupLocation: quote.pickupLocation,
      dropoffLocation: quote.dropoffLocation,
      departureDate: quote.departureDate,
      numberOfDays: quote.numberOfDays,
      busType: quote.busType,
      numberOfPassengers: quote.numberOfPassengers,
      pricePerDay: quote.estimatedPrice,
      totalPrice: quote.estimatedPrice * quote.numberOfDays,
      specialRequests: quote.specialRequests,
      adminNotes: quote.adminNotes,
      status: 'confirmed',
      paymentStatus: 'pending',
      bookingType: 'confirmed'
    });

    await booking.populate('user', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('[Booking] Create booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating booking'
    });
  }
};

/**
 * UPDATE BOOKING STATUS
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (status) booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;

    await booking.save();
    await booking.populate('user', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('[Booking] Update booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating booking'
    });
  }
};

/**
 * MARK BOOKING AS PAID
 */
exports.markAsPaid = async (req, res) => {
  try {
    const { paymentMethod, invoiceNumber, paymentDate } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.markAsPaid({
      paymentMethod,
      invoiceNumber,
      paymentDate: paymentDate || new Date()
    });

    await booking.populate('user', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      message: 'Booking marked as paid',
      data: booking
    });
  } catch (error) {
    console.error('[Booking] Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating payment status'
    });
  }
};

/**
 * CANCEL BOOKING
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    await booking.cancel(req.user._id, reason);
    await booking.populate('user', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('[Booking] Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling booking'
    });
  }
};

/**
 * DELETE BOOKING
 */
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('[Booking] Delete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting booking'
    });
  }
};
