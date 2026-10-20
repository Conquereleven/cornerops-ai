const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();
  // Capture before routers rewrite req.url; never include query strings or headers.
  const method = req.method;
  const pathname = req.path.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 2048);
  res.on('finish', () => {
    logger.info('http_request', {
      method,
      path: pathname,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });
  next();
};

module.exports = requestLogger;
