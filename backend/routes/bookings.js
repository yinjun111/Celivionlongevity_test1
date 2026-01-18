const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getAvailableSlots
} = require('../controllers/bookingController');

// Get all bookings (with optional filters)
// Query params: ?status=confirmed&date=2024-01-15
router.get('/', getAllBookings);

// Get available time slots for a date
// Query params: ?date=2024-01-15&duration=60
router.get('/available-slots', getAvailableSlots);

// Get specific booking by ID
router.get('/:id', getBookingById);

// Create new booking
router.post('/', createBooking);

// Update booking
router.put('/:id', updateBooking);

// Delete booking
router.delete('/:id', deleteBooking);

module.exports = router;
