const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Validate Razorpay configuration
const validateConfig = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured. Please check your environment variables.');
  }
};

// Test Razorpay connection
const testConnection = async () => {
  try {
    await razorpay.orders.create({
      amount: 100,
      currency: 'INR',
      receipt: 'test_connection'
    });
    console.log('Razorpay connection successful');
  } catch (error) {
    console.error('Razorpay connection failed:', error.message);
  }
};

module.exports = {
  razorpay,
  validateConfig,
  testConnection
}; 