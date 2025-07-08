const crypto = require('crypto');

// Generate signature for payment verification
const generateSignature = (orderId, paymentId, secret) => {
  const data = orderId + '|' + paymentId;
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
};

// Verify payment signature
const verifySignature = (orderId, paymentId, signature, secret) => {
  const expectedSignature = generateSignature(orderId, paymentId, secret);
  return signature === expectedSignature;
};

// Generate webhook signature
const generateWebhookSignature = (payload, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};

// Verify webhook signature
const verifyWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return signature === expectedSignature;
};

// Generate random receipt ID (max 40 characters for Razorpay)
const generateReceiptId = (prefix = 'receipt') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6); // Shorter random string
  const receipt = `${prefix}_${timestamp}_${random}`;
  
  // Ensure it's within 40 character limit
  return receipt.length > 40 ? receipt.substring(0, 40) : receipt;
};

// Generate random order ID
const generateOrderId = (prefix = 'order') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
};

module.exports = {
  generateSignature,
  verifySignature,
  generateWebhookSignature,
  verifyWebhookSignature,
  generateReceiptId,
  generateOrderId
}; 