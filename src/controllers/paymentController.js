const { razorpay } = require('../config/razorpay');
const { verifySignature, generateReceiptId } = require('../utils/crypto');
const { sanitizeAmount, sanitizeReceipt } = require('../utils/validation');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const supabase = require('../lib/supabase');
const workerManager = require('../services/workerManager');

const createOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt, bookingId } = req.body;

  logger.info(`Creating order request:`, { amount, currency, receipt, bookingId });

  // Sanitize amount
  const paiseAmount = sanitizeAmount(amount);
  
  if (paiseAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid amount'
    });
  }

  // Generate receipt if not provided and ensure it's within 40 character limit
  let orderReceipt = sanitizeReceipt(receipt || generateReceiptId('booking'));

  try {
    logger.info(`Creating Razorpay order with amount: ${paiseAmount} paise`);
    
    const order = await razorpay.orders.create({
      amount: paiseAmount,
      currency,
      receipt: orderReceipt,
      notes: {
        bookingId: bookingId || 'test_booking',
        description: 'Flight booking payment',
        source: 'thenaair_web'
      }
    });

    logger.info(`Order created successfully: ${order.id} for amount: ${paiseAmount} paise`);

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at
      }
    });
  } catch (error) {
    logger.error(`Order creation failed: ${error.message}`, { error: error.toString() });
    throw error;
  }
});

// Verify payment signature
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature, bookingId } = req.body;

  try {
    // Verify signature
    const isValidSignature = verifySignature(
      orderId,
      paymentId,
      signature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isValidSignature) {
      logger.warn(`Invalid signature for payment: ${paymentId}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status !== 'captured') {
      logger.warn(`Payment not captured: ${paymentId}, status: ${payment.status}`);
      return res.status(400).json({
        success: false,
        error: 'Payment not captured'
      });
    }

    // Verify order ID matches
    if (payment.order_id !== orderId) {
      logger.warn(`Order ID mismatch for payment: ${paymentId}`);
      return res.status(400).json({
        success: false,
        error: 'Order ID mismatch'
      });
    }

    // Fetch user_id from bookings table using Supabase
    let user_id = null;
    if (bookingId) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('id', bookingId)
        .single();
      
      if (bookingError) {
        logger.error(`Booking not found: ${bookingId}`, bookingError);
      } else {
        user_id = booking.user_id;
      }
    }

    // Insert payment record into payments table using Supabase
    try {
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          user_id: user_id,
          amount: payment.amount / 100, // convert paise to rupees
          currency: payment.currency,
          status: 'success',
          method: payment.method,
          provider: 'Razorpay',
          provider_ref: payment.id
        });
      
      if (insertError) {
        logger.error(`Failed to insert payment record: ${insertError.message}`);
      } else {
        logger.info(`Payment record inserted for booking: ${bookingId}`);
      }
    } catch (insertError) {
      logger.error(`Failed to insert payment record: ${insertError.message}`);
    }

    // Update booking status and send emails
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);
      
      if (updateError) {
        logger.error(`Failed to update booking status: ${updateError.message}`);
      } else {
        logger.info(`Booking status updated to confirmed for booking: ${bookingId}`);
        
        // Get user email for sending e-ticket
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(user_id);
        
        if (!userError && user.user.email) {
          // Send payment confirmation email immediately
          try {
            await workerManager.sendPaymentConfirmation(
              bookingId, 
              {
                provider_ref: payment.id,
                amount: payment.amount / 100,
                currency: payment.currency,
                method: payment.method
              }, 
              user.user.email
            );
            logger.info(`Payment confirmation email queued for booking: ${bookingId}`);
          } catch (emailError) {
            logger.error(`Failed to queue payment confirmation email: ${emailError.message}`);
          }
          
          // Send e-ticket email after a short delay
          setTimeout(async () => {
            try {
              await workerManager.sendETicket(bookingId, user.user.email);
              logger.info(`E-ticket email queued for booking: ${bookingId}`);
            } catch (emailError) {
              logger.error(`Failed to queue e-ticket email: ${emailError.message}`);
            }
          }, 2000); // 2 second delay
        }
      }
    } catch (updateError) {
      logger.error(`Failed to update booking status: ${updateError.message}`);
    }

    logger.info(`Payment verified successfully: ${paymentId}`);

    res.json({
      success: true,
      verified: true,
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        capturedAt: payment.captured_at,
        description: payment.description
      }
    });
  } catch (error) {
    logger.error(`Payment verification failed: ${error.message}`);
    throw error;
  }
});

// Get payment details
const getPaymentDetails = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await razorpay.payments.fetch(paymentId);

    logger.info(`Payment details fetched: ${paymentId}`);

    res.json({
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        capturedAt: payment.captured_at,
        description: payment.description,
        email: payment.email,
        contact: payment.contact
      }
    });
  } catch (error) {
    logger.error(`Failed to fetch payment: ${error.message}`);
    throw error;
  }
});

// Get order details
const getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await razorpay.orders.fetch(orderId);

    logger.info(`Order details fetched: ${orderId}`);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
        notes: order.notes
      }
    });
  } catch (error) {
    logger.error(`Failed to fetch order: ${error.message}`);
    throw error;
  }
});



module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  getOrderDetails
}; 