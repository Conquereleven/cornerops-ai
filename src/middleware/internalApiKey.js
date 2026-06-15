const env = require('../config/env');

const internalApiKey = (req, res, next) => {
  if (env.nodeEnv === 'test') return next();

  if (!env.internalApiKey) {
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

module.exports = internalApiKey;
