const { validateOrderRequest, validatePaymentVerification } = require('../utils/validation');

const validateOrder = (req, res, next) => {
  const validation = validateOrderRequest(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors
    });
  }
  
  next();
};

const validatePayment = (req, res, next) => {
  const validation = validatePaymentVerification(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors
    });
  }
  
  next();
};

const rateLimit = (req, res, next) => {
  const clientIP = req.ip;
  const now = Date.now();
  
  if (!req.app.locals.rateLimit) {
    req.app.locals.rateLimit = new Map();
  }
  
  const userRequests = req.app.locals.rateLimit.get(clientIP) || [];
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 100;
  
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later'
    });
  }
  
  recentRequests.push(now);
  req.app.locals.rateLimit.set(clientIP, recentRequests);
  
  next();
};

module.exports = {
  validateOrder,
  validatePayment,
  rateLimit
}; 