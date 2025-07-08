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

/**
 * @swagger
 * /api/admin/flights:
 *   get:
 *     summary: Get all flights
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of all flights
 */
router.get('/flights', getAllFlights);

/**
 * @swagger
 * /api/admin/flights:
 *   post:
 *     summary: Create a flight
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             flight_number: "AI-202"
 *             departure: "Chennai"
 *             destination: "Delhi"
 *             departure_time: "2025-07-09T10:00:00Z"
 *             arrival_time: "2025-07-09T12:00:00Z"
 *             price: 4500
 *             seats_available: 150
 *     responses:
 *       201:
 *         description: Flight created
 */
router.post('/flights', createFlight);

/**
 * @swagger
 * /api/admin/flights/{id}:
 *   put:
 *     summary: Update a flight
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             flight_number: "AI-202"
 *             departure: "Chennai"
 *             destination: "Mumbai"
 *             price: 5000
 *     responses:
 *       200:
 *         description: Flight updated
 */
router.put('/flights/:id', updateFlight);

/**
 * @swagger
 * /api/admin/flights/{id}:
 *   delete:
 *     summary: Delete a flight
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flight deleted
 */
router.delete('/flights/:id', deleteFlight);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard stats
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/bookings', getBookings);

/**
 * @swagger
 * /api/admin/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get('/payments', getPayments);

module.exports = router;