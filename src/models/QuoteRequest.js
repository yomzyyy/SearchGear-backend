const mongoose = require('mongoose');

const quoteRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
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
  numberOfDays: {
    type: Number,
    required: [true, 'Number of days is required'],
    min: [1, 'Number of days must be at least 1']
  },
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
    min: [1, 'Number of passengers must be at least 1'],
    max: [60, 'Number of passengers cannot exceed 60'],
    validate: {
      validator: function(value) {
        if (this.busType === '49-seater' && value > 49) {
          return false;
        }
        if (this.busType === '60-seater' && value > 60) {
          return false;
        }
        return true;
      },
      message: 'Number of passengers exceeds bus capacity'
    }
  },
  departureDate: {
    type: Date,
    required: [true, 'Departure date is required'],
    validate: {
      validator: function(value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'Departure date must be today or in the future'
    }
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'quoted', 'approved', 'rejected'],
      message: 'Status must be pending, quoted, approved, or rejected'
    },
    default: 'pending'
  },
  estimatedPrice: {
    type: Number,
    min: [0, 'Estimated price cannot be negative']
  },
  adminNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

quoteRequestSchema.index({ user: 1, createdAt: -1 });
quoteRequestSchema.index({ status: 1 });

quoteRequestSchema.virtual('quoteNumber').get(function() {
  return `QR-${this._id.toString().slice(-8).toUpperCase()}`;
});

quoteRequestSchema.set('toJSON', { virtuals: true });
quoteRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('QuoteRequest', quoteRequestSchema);
