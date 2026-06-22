const { timingSafeEqual } = require('crypto');
const env = require('../config/env');

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const isLoopback = (req) => {
  const addresses = [req.ip, req.socket?.remoteAddress].filter(Boolean);
  return addresses.some((address) => LOOPBACK_ADDRESSES.has(String(address)));
};

const safeEqual = (left, right) => {
  const first = Buffer.from(String(left || ''));
  const second = Buffer.from(String(right || ''));
  return first.length === second.length && timingSafeEqual(first, second);
};

const providedToken = (req) => {
  const bearer = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  return req.get('x-cornerops-console-token') || bearer || '';
};

const createWebConsoleGuard = (config = env) => (req, res, next) => {
  if (!config.corneropsWebConsoleEnabled) {
    return res.status(404).json({ error: true, message: 'Control Tower web console is disabled.' });
  }
  if (config.corneropsWebConsoleLocalOnly && !isLoopback(req)) {
    return res.status(403).json({ error: true, message: 'Control Tower web console is local-only.' });
  }
  const origin = req.get('origin');
  if (origin && !config.corneropsWebConsoleAllowedOrigins.includes(origin)) {
    return res.status(403).json({ error: true, message: 'Origin is not allowed.' });
  }
  const authRequired = config.corneropsWebConsoleRequireAuth
    || Boolean(config.corneropsWebConsoleAuthToken);
  if (authRequired && !config.corneropsWebConsoleAuthToken) {
    return res.status(503).json({ error: true, message: 'Control Tower authentication is not configured.' });
  }
  if (authRequired && !safeEqual(providedToken(req), config.corneropsWebConsoleAuthToken)) {
    return res.status(401).json({ error: true, message: 'Invalid Control Tower credentials.' });
  }
  if (
    !config.corneropsWebConsoleReadOnly
    || !config.corneropsWebConsoleDryRun
    || !config.corneropsFailClosed
    || !config.corneropsPiiMasking
    || !config.corneropsLogSanitization
    || !config.corneropsAuditViewerMaskPii
    || !config.corneropsSecurityDashboardMaskPii
  ) {
    return res.status(503).json({ error: true, message: 'Control Tower safety configuration is invalid.' });
  }
  return next();
};

module.exports = { LOOPBACK_ADDRESSES, createWebConsoleGuard, isLoopback, safeEqual };
