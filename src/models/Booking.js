/**
 * BOOKING MODEL
 *
 * This model represents a confirmed booking that originated from an approved quotation.
 *
 * BOOKING LIFECYCLE:
 * 1. Customer requests quotation → QuoteRequest created
 * 2. Admin responds with price → QuoteRequest status = 'quoted'
 * 3. Customer approves → QuoteRequest status = 'approved' + Booking created
 * 4. Payment made → Booking payment status = 'paid'
 * 5. Trip completed → Booking status = 'completed'
 *
 * LEARNING POINTS:
 * - References to other models (Quote, User, Fleet)
 * - Enum validation for status fields
 * - Virtual fields for computed data
 * - Timestamps for tracking
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // REFERENCE TO ORIGINAL QUOTATION
  // This links back to the quote request
  quoteRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuoteRequest',
    required: [true, 'Quote request reference is required']
  },

  // CUSTOMER INFORMATION
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },

  // TRIP DETAILS (copied from quotation for easy access)
  pickupLocation: {
    type: String,
    required: [true, 'Pickup location is required'],
    trim: true
  },

  dropoffLocation: {
    type: String,
    required: [true, 'Drop-off location is required'],
    trim: true
  },

  departureDate: {
    type: Date,
    required: [true, 'Departure date is required']
  },

  returnDate: {
    type: Date
  },

  numberOfDays: {
    type: Number,
    required: [true, 'Number of days is required'],
    min: [1, 'Number of days must be at least 1']
  },

  // BUS DETAILS
  busType: {
    type: String,
    enum: {
      values: ['49-seater', '60-seater'],
      message: 'Bus type must be either 49-seater or 60-seater'
    },
    required: [true, 'Bus type is required']
  },

  numberOfPassengers: {
    type: Number,
    required: [true, 'Number of passengers is required'],
    min: [1, 'Number of passengers must be at least 1']
  },

  // PRICING
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },

  pricePerDay: {
    type: Number,
    required: [true, 'Price per day is required'],
    min: [0, 'Price per day cannot be negative']
  },

  // BOOKING STATUS
  // Tracks the overall booking status
  status: {
    type: String,
    enum: {
      values: ['confirmed', 'in-progress', 'completed', 'cancelled'],
      message: 'Status must be confirmed, in-progress, completed, or cancelled'
    },
    default: 'confirmed'
  },

  // PAYMENT STATUS
  // Tracks payment separately from booking status
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'partial', 'paid', 'refunded'],
      message: 'Payment status must be pending, partial, paid, or refunded'
    },
    default: 'pending'
  },

  // BOOKING TYPE
  // Helps differentiate in the calendar
  bookingType: {
    type: String,
    enum: {
      values: ['quotation', 'confirmed', 'paid'],
      message: 'Booking type must be quotation, confirmed, or paid'
    },
    default: 'quotation'
  },

  // PAYMENT DETAILS
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank-transfer', 'credit-card', 'gcash', 'paymaya'],
    trim: true
  },

  paymentDate: {
    type: Date
  },

  invoiceNumber: {
    type: String,
    trim: true
  },

  // SPECIAL REQUESTS
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special requests cannot exceed 1000 characters']
  },

  // ADMIN NOTES
  adminNotes: {
    type: String,
    trim: true
  },

  // CANCELLATION
  cancellationReason: {
    type: String,
    trim: true
  },

  cancelledAt: {
    type: Date
  },

  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true // Adds createdAt and updatedAt
});

// INDEXES FOR PERFORMANCE
// Speed up queries by date ranges (for calendar view)
bookingSchema.index({ departureDate: 1 });
bookingSchema.index({ status: 1, departureDate: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bookingType: 1, departureDate: 1 });

// VIRTUAL: Booking Number
// Generates a user-friendly booking number
bookingSchema.virtual('bookingNumber').get(function() {
  return `BK-${this._id.toString().slice(-8).toUpperCase()}`;
});

// VIRTUAL: Is Active
// Check if booking is currently active
bookingSchema.virtual('isActive').get(function() {
  return ['confirmed', 'in-progress'].includes(this.status);
});

// VIRTUAL: Days Until Departure
// Calculate how many days until the trip
bookingSchema.virtual('daysUntilDeparture').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const departure = new Date(this.departureDate);
  departure.setHours(0, 0, 0, 0);
  const diffTime = departure - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// STATIC METHOD: Get Bookings by Date Range
// For calendar view - get all bookings in a date range
bookingSchema.statics.getByDateRange = async function(startDate, endDate) {
  return this.find({
    departureDate: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .populate('user', 'firstName lastName email phone')
  .populate('quoteRequest')
  .sort({ departureDate: 1 });
};

// STATIC METHOD: Get Calendar Events
// Format bookings for calendar display
bookingSchema.statics.getCalendarEvents = async function(startDate, endDate) {
  const bookings = await this.getByDateRange(startDate, endDate);

  return bookings.map(booking => ({
    id: booking._id,
    title: `${booking.user.firstName} ${booking.user.lastName} - ${booking.busType}`,
    start: new Date(booking.departureDate),
    end: booking.returnDate ? new Date(booking.returnDate) : new Date(booking.departureDate),
    resource: {
      bookingType: booking.bookingType,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      booking: booking
    }
  }));
};

// INSTANCE METHOD: Mark as Paid
bookingSchema.methods.markAsPaid = async function(paymentDetails) {
  this.paymentStatus = 'paid';
  this.bookingType = 'paid';
  this.paymentDate = paymentDetails.paymentDate || new Date();
  this.paymentMethod = paymentDetails.paymentMethod;
  this.invoiceNumber = paymentDetails.invoiceNumber;

  return this.save();
};

// INSTANCE METHOD: Cancel Booking
bookingSchema.methods.cancel = async function(userId, reason) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  this.cancelledBy = userId;

  return this.save();
};

// PRE-SAVE HOOK
// Calculate return date if not provided
bookingSchema.pre('save', function(next) {
  if (!this.returnDate && this.departureDate && this.numberOfDays) {
    const returnDate = new Date(this.departureDate);
    returnDate.setDate(returnDate.getDate() + this.numberOfDays);
    this.returnDate = returnDate;
  }
  next();
});

// Enable virtuals in JSON
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
