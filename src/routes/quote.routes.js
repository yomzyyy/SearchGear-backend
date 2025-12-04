const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createQuote,
  getMyQuotes,
  getQuoteById,
  getAllQuotes,
  updateQuote,
  deleteQuote
} = require('../controllers/quoteController');

router.post('/', protect, createQuote);
router.get('/my-quotes', protect, getMyQuotes);
router.get('/:id', protect, getQuoteById);

router.get('/admin/all', protect, authorize('admin'), getAllQuotes);
router.patch('/admin/:id', protect, authorize('admin'), updateQuote);
router.delete('/admin/:id', protect, authorize('admin'), deleteQuote);

module.exports = router;
