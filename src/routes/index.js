const express = require('express');
const router = express.Router();
const paymentRoutes = require('./paymentRoutes');
const ticketRoutes = require('./ticketRoutes');
const adminRoutes = require('./adminRoutes');

// Payment routes
router.use('/payment', paymentRoutes);

// Ticket PDF routes (use /ticket as base path)
router.use('/ticket', ticketRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// API versioning
router.use('/v1', (req, res, next) => {
  req.apiVersion = 'v1';
  next();
}, paymentRoutes);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'ThenaAir Backend API',
    version: '1.0.0',
    endpoints: {
      payment: '/payment',
      ticket: '/ticket/:bookingId/pdf',
      admin: '/admin',
      'api-v1': '/v1'
    }
  });
});

module.exports = router; 