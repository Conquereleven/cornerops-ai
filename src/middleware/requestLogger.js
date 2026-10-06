const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    logger.info('http_request', {
      method: req.method,
      // Query strings can carry search terms or identifiers; never log them.
      path: String(req.originalUrl || '').split('?')[0],
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });
  next();
};

module.exports = requestLogger;
