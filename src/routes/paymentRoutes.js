const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validateOrder, validatePayment, rateLimit } = require('../middleware/validation');

/**
 * @swagger
 * /api/payment/create-order:
 *   post:
 *     summary: Create a Razorpay payment order
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               receipt:
 *                 type: string
 *             required: [amount, currency, receipt]
 *     responses:
 *       200:
 *         description: Razorpay order created successfully
 */
router.post('/create-order',rateLimit,validateOrder,paymentController.createOrder);

/**
 * @swagger
 * /api/payment/verify-payment:
 *   post:
 *     summary: Verify payment from Razorpay
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *     responses:
 *       200:
 *         description: Payment verified successfully
 */
router.post('/verify-payment', rateLimit,validatePayment,paymentController.verifyPayment);

/**
 * @swagger
 * /api/payment/payment/{paymentId}:
 *   get:
 *     summary: Get details of a specific payment
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Razorpay payment ID
 *     responses:
 *       200:
 *         description: Payment details returned
 */
router.get('/payment/:paymentId',rateLimit,paymentController.getPaymentDetails);

/**
 * @swagger
 * /api/payment/order/{orderId}:
 *   get:
 *     summary: Get details of a specific order
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Razorpay order ID
 *     responses:
 *       200:
 *         description: Order details returned
 */
router.get('/order/:orderId', rateLimit,paymentController.getOrderDetails);

module.exports = router;
