const env = require('../../config/env');
const { safeHashEqual, sha256 } = require('./controlTowerFrontendAuth');

const buckets = new Map();

const auditDenied = async (recordAudit, req, code) => {
  try {
    await recordAudit?.({
      eventType: 'authentication_denied',
      entityType: 'founder_action_auth',
      actorType: 'unknown',
      correlationId: req.get('x-correlation-id') || req.get('x-request-id') || null,
      metadata: { code, method: req.method, path: req.path },
    });
  } catch (_error) { /* Authentication must fail closed even if audit persistence is unavailable. */ }
};

const deny = async (req, res, recordAudit, status, code, message) => {
  await auditDenied(recordAudit, req, code);
  return res.status(status).json({
    status: 'error',
    code,
    message,
    executed: false,
    writesBlocked: true,
    externalSendsBlocked: true,
    auditId: `audit-founder-action-denied-${Date.now()}`,
  });
};

const createControlTowerFounderActionAuth = ({ config = env, recordAudit } = {}) => (
  async (req, res, next) => {
    if (!['POST', 'PATCH'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (origin && !(config.controlTowerFrontendAllowedOrigins || []).includes(origin)) {
      return deny(req, res, recordAudit, 403, 'FOUNDER_ACTION_ORIGIN_DENIED', 'Founder-action origin is not exactly allowlisted.');
    }
    if (!req.is('application/json')) {
      return deny(req, res, recordAudit, 415, 'FOUNDER_ACTION_CONTENT_TYPE_REQUIRED', 'Content-Type application/json is required.');
    }
    if (!config.controlTowerFounderActionAuthRequired) {
      return deny(req, res, recordAudit, 503, 'FOUNDER_ACTION_AUTH_UNSAFE_CONFIG', 'Founder-action authentication cannot be disabled.');
    }
    if (!config.controlTowerFounderActionTokenHash) {
      return deny(req, res, recordAudit, 503, 'FOUNDER_ACTION_TOKEN_HASH_MISSING', 'Founder-action token hash is not configured.');
    }
    const token = req.get('x-cornerops-founder-action-token') || '';
    if (!token) {
      return deny(req, res, recordAudit, 401, 'FOUNDER_ACTION_TOKEN_MISSING', 'Founder-action token is required.');
    }
    if (!safeHashEqual(token, config.controlTowerFounderActionTokenHash)) {
      return deny(req, res, recordAudit, 403, 'FOUNDER_ACTION_TOKEN_INVALID', 'Founder-action token is invalid.');
    }
    const key = sha256(token).slice(0, 16);
    const now = Date.now();
    const limit = config.controlTowerFounderActionRateLimitPerMinute || 10;
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 1, resetAt: now + 60000 }
      : { count: current.count + 1, resetAt: current.resetAt };
    buckets.set(key, bucket);
    if (bucket.count > limit) {
      return deny(req, res, recordAudit, 429, 'FOUNDER_ACTION_RATE_LIMITED', 'Founder-action rate limit exceeded.');
    }
    req.founderActionAuth = {
      authenticated: true,
      actorId: req.get('x-operator-id') || 'founder',
      tokenFingerprint: key,
    };
    return next();
  }
);

module.exports = { buckets, createControlTowerFounderActionAuth };
