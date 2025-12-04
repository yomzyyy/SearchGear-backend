const QuoteRequest = require('../models/QuoteRequest');

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
