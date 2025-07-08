// Validation utilities for API requests

const validateOrderRequest = (data) => {
  const errors = [];

  if (!data.amount || data.amount <= 0) {
    errors.push('Amount is required and must be greater than 0');
  }

  if (data.amount && data.amount > 1000000) {
    errors.push('Amount cannot exceed ₹10,00,000');
  }

  if (data.currency && !['INR'].includes(data.currency)) {
    errors.push('Only INR currency is supported');
  }

  // Validate receipt length (Razorpay limit: 40 characters)
  if (data.receipt && data.receipt.length > 40) {
    errors.push('Receipt ID must be 40 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validatePaymentVerification = (data) => {
  const errors = [];

  if (!data.orderId) {
    errors.push('Order ID is required');
  }

  if (!data.paymentId) {
    errors.push('Payment ID is required');
  }

  if (!data.signature) {
    errors.push('Signature is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateWebhookRequest = (data, signature, webhookSecret) => {
  const errors = [];

  if (!signature) {
    errors.push('Webhook signature is required');
  }

  if (!webhookSecret) {
    errors.push('Webhook secret is not configured');
  }

  if (!data || !data.event) {
    errors.push('Invalid webhook payload');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const sanitizeAmount = (amount) => {
  // Convert to paise and ensure it's a valid number
  const paiseAmount = Math.round(parseFloat(amount) * 100);
  return isNaN(paiseAmount) ? 0 : paiseAmount;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

const sanitizeReceipt = (receipt) => {
  // Ensure receipt is within 40 character limit for Razorpay
  if (!receipt) return receipt;
  return receipt.length > 40 ? receipt.substring(0, 40) : receipt;
};

module.exports = {
  validateOrderRequest,
  validatePaymentVerification,
  validateWebhookRequest,
  sanitizeAmount,
  sanitizeReceipt,
  validateEmail,
  validatePhone
}; 