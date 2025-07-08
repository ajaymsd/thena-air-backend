const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import configurations
const { validateConfig } = require('./src/config/razorpay');
const { validateEmailConfig } = require('./src/config/email');

// Import middleware
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Import routes
const routes = require('./src/routes');

// Import logger
const logger = require('./src/utils/logger');

// Import worker manager
const workerManager = require('./src/services/workerManager');

const app = express();

// Validate configurations
try {
  validateConfig();
  validateEmailConfig();
} catch (error) {
  logger.error(`Configuration error: ${error.message}`);
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Initialize worker manager and start server
async function startServer() {
  try {
    // Try to initialize email workers (optional)
    try {
      await workerManager.initialize();
      logger.info('📧 Email workers initialized successfully');
    } catch (workerError) {
      logger.warn(`Email workers failed to initialize: ${workerError.message}`);
      logger.info('📧 Email functionality will be disabled');
    }
    
    app.listen(PORT, () => {
      logger.info(`ThenaAir Backend running on port ${PORT}`);
      logger.info(`Razorpay integration ready`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await workerManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await workerManager.shutdown();
  process.exit(0);
});

startServer(); 