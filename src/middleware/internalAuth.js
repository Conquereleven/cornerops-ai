const { createHash, timingSafeEqual } = require('crypto');
const env = require('../config/env');

const internalAuth = (req, res, next) => {
  if (!env.internalApiKey) {
    return res.status(503).json({ error: true, message: 'Internal API access is not configured.' });
  }
  const hash = (value) => createHash('sha256').update(String(value || '')).digest();
  if (!timingSafeEqual(hash(req.get('x-internal-api-key')), hash(env.internalApiKey))) {
    return res.status(401).json({ error: true, message: 'Invalid internal API key.' });
  }
  return next();
};
module.exports = internalAuth;
