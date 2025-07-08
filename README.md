# ThenaAir Backend - Structured Architecture

A well-organized Node.js backend for ThenaAir flight booking system with Razorpay payment integration, following MVC architecture.

## 🏗️ Architecture Overview

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # Database configuration
│   │   └── razorpay.js  # Razorpay configuration
│   ├── controllers/     # Business logic controllers
│   │   ├── paymentController.js
│   │   └── healthController.js
│   ├── middleware/      # Express middleware
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── routes/          # API routes
│   │   ├── index.js
│   │   ├── paymentRoutes.js
│   │   └── healthRoutes.js
│   └── utils/           # Utility functions
│       ├── logger.js
│       ├── validation.js
│       └── crypto.js
├── logs/                # Log files (auto-generated)
├── server.js           # Main application entry point
├── package.json
└── env.example
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
# Copy environment file
cp env.example .env

# Edit .env with your Razorpay credentials
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
```

### 3. Run Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📋 API Endpoints

### Health Check
```
GET /api/health
GET /api/health/detailed
```

### Payment Operations
```
POST /api/payment/create-order
POST /api/payment/verify-payment
GET  /api/payment/:paymentId
GET  /api/payment/order/:orderId
POST /api/payment/webhook
```

### API Versioning
```
POST /api/v1/create-order
POST /api/v1/verify-payment
```

## 🔧 Configuration

### Environment Variables
- `RAZORPAY_KEY_ID` - Your Razorpay test/live key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay test/live key secret
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `WEBHOOK_SECRET` - Webhook signature secret (for production)

### Database Configuration
- Currently configured for future database integration
- Supports PostgreSQL and Supabase configurations

## 🛡️ Security Features

### Input Validation
- Request body validation
- Amount sanitization
- Email and phone validation
- Payment signature verification

### Rate Limiting
- Basic rate limiting (100 requests per 15 minutes)
- Configurable limits per endpoint
- IP-based tracking

### Error Handling
- Centralized error handling
- Detailed logging with Winston
- Security-focused error messages
- Graceful degradation

## 📊 Logging

### Log Levels
- `error` - Application errors
- `warn` - Warning messages
- `info` - General information
- `http` - HTTP requests
- `debug` - Debug information (development only)

### Log Files
- `logs/error.log` - Error logs only
- `logs/all.log` - All logs
- Console output with colors

## 🧪 Testing

### Test Cards (Razorpay Test Mode)
- **Card Number:** 4111 1111 1111 1111
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **Name:** Any name

### Test UPI
- **UPI ID:** success@razorpay

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Create order
curl -X POST http://localhost:3001/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "currency": "INR"}'
```

## 🔄 Webhook Handling

### Supported Events
- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `order.paid` - Order completed
- `refund.processed` - Refund processed

### Webhook Security
- Signature verification
- Event validation
- Error handling
- Logging

## 📈 Monitoring

### Health Checks
- Service status monitoring
- Razorpay connection testing
- Memory usage tracking
- Uptime monitoring

### Performance
- Request logging
- Response time tracking
- Error rate monitoring
- Resource usage

## 🚀 Production Deployment

### Environment Setup
```bash
NODE_ENV=production
RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
WEBHOOK_SECRET=your_webhook_secret
```

### Security Checklist
- [ ] Use production Razorpay keys
- [ ] Set up webhook endpoints
- [ ] Configure rate limiting
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Set up database
- [ ] Test webhook signatures

## 🔧 Development

### Code Structure
- **Controllers:** Handle business logic
- **Routes:** Define API endpoints
- **Middleware:** Request processing
- **Utils:** Reusable functions
- **Config:** Application configuration

### Adding New Features
1. Create controller in `src/controllers/`
2. Add routes in `src/routes/`
3. Add validation in `src/utils/validation.js`
4. Update main routes in `src/routes/index.js`
5. Add tests and documentation

## 📝 Notes

- Amount should be in paise (₹1 = 100 paise)
- Always verify payments server-side
- Use webhooks for production reliability
- Test thoroughly before going live
- Monitor logs for debugging
- Keep dependencies updated 