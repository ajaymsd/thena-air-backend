const express = require('express');
const router = express.Router();
const {
  getAllFlights,
  createFlight,
  updateFlight,
  deleteFlight,
  getDashboardStats,
  getBookings,
  getPayments
} = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

router.use(adminAuth);
router.get('/flights', getAllFlights);
router.post('/flights', createFlight);
router.put('/flights/:id', updateFlight);
router.delete('/flights/:id', deleteFlight);

router.get('/dashboard', getDashboardStats);
router.get('/bookings', getBookings);
router.get('/payments', getPayments);

module.exports = router;