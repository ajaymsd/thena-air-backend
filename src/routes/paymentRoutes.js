const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validateOrder, validatePayment, rateLimit } = require('../middleware/validation');

// Create payment order
router.post('/create-order', 
  rateLimit,
  validateOrder, 
  paymentController.createOrder
);

// Verify payment
router.post('/verify-payment', 
  rateLimit,
  validatePayment, 
  paymentController.verifyPayment
);

// Get payment details
router.get('/payment/:paymentId', 
  rateLimit,
  paymentController.getPaymentDetails
);

// Get order details
router.get('/order/:orderId', 
  rateLimit,
  paymentController.getOrderDetails
);



module.exports = router; 