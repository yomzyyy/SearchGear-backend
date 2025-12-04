const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getAllBookings,
  getCalendarEvents,
  getBookingById,
  createBookingFromQuotation,
  updateBookingStatus,
  markAsPaid,
  cancelBooking,
  deleteBooking
} = require('../controllers/bookingController');

// ADMIN ROUTES
// All booking routes require admin authentication
router.get('/admin/all', protect, authorize('admin'), getAllBookings);
router.get('/admin/calendar', protect, authorize('admin'), getCalendarEvents);
router.get('/admin/:id', protect, authorize('admin'), getBookingById);
router.post('/admin/create', protect, authorize('admin'), createBookingFromQuotation);
router.patch('/admin/:id/status', protect, authorize('admin'), updateBookingStatus);
router.patch('/admin/:id/mark-paid', protect, authorize('admin'), markAsPaid);
router.patch('/admin/:id/cancel', protect, authorize('admin'), cancelBooking);
router.delete('/admin/:id', protect, authorize('admin'), deleteBooking);

module.exports = router;
