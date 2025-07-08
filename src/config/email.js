const logger = require('../utils/logger');
const validateEmailConfig = () => {
  const requiredVars = [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required email configuration: ${missingVars.join(', ')}`);
  }

  logger.info('Email configuration validated successfully');
};

module.exports = {
  validateEmailConfig
}; 