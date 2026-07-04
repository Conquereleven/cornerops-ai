const crypto = require('crypto');
const env = require('../../config/env');

const buckets = new Map();

const fingerprint = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 16);

const createControlTowerFrontendRateLimit = (config = env, store = buckets) => (req, res, next) => {
  const limit = config.controlTowerFrontendRateLimitPerMinute || 60;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const key = req.controlTowerFrontendAuth?.tokenFingerprint
    || fingerprint(req.ip || req.socket?.remoteAddress || 'unknown');
  const existing = store.get(key) || { count: 0, resetAt: now + windowMs };
  const bucket = existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing;
  bucket.count += 1;
  store.set(key, bucket);
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
  if (bucket.count > limit) {
    return res.status(429).json({
      status: 'error',
      code: 'CONTROL_TOWER_FRONTEND_RATE_LIMITED',
      message: 'Control Tower frontend API rate limit exceeded.',
      sourceMode: 'disabled',
      readOnly: true,
      dryRun: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      auditId: `audit-frontend-rate-limited-${now}`,
      warnings: ['Reduce request frequency or increase CONTROL_TOWER_FRONTEND_RATE_LIMIT_PER_MINUTE.'],
      data: {},
    });
  }
  return next();
};

module.exports = { createControlTowerFrontendRateLimit, buckets };
