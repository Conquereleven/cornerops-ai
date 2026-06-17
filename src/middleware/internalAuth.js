const env = require('../config/env');
const logger = require('../utils/logger');

const internalAuth = (req, res, next) => {
  if (env.nodeEnv === 'test') return next();

  if (!env.internalApiKey) {
    if (env.allowInternalNoKey) {
      logger.warn('internal_api_unprotected', {
        path: req.originalUrl,
        reason: 'ALLOW_INTERNAL_NO_KEY=true',
      });
      return next();
    }
    return res.status(503).json({
      error: true,
      message: 'Internal API access is not configured.',
    });
  }

  if (req.get('x-internal-api-key') !== env.internalApiKey) {
    return res.status(401).json({
      error: true,
      message: 'Invalid internal API key.',
    });
  }

  return next();
};

module.exports = internalAuth;
