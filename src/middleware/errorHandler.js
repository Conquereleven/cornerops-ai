const env = require('../config/env');
const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const log = statusCode >= 500 ? logger.error : logger.warn;
  log('request_error', {
    statusCode,
    path: String(req.originalUrl || '').split('?')[0],
    message: error.message,
    ...(statusCode >= 500 &&
      env.nodeEnv !== 'production' && { stack: error.stack }),
  });
  res.status(statusCode).json({
    error: true,
    ...(error.code && { code: error.code }),
    message: statusCode >= 500 ? 'Internal server error' : error.message,
  });
};

module.exports = errorHandler;
