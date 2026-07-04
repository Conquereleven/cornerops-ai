const env = require('../../config/env');

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

const isOriginAllowed = (origin, config = env) => {
  if (!origin) return true;
  if (config.controlTowerFrontendAllowLocalhost && LOCALHOST_ORIGIN.test(origin)) return true;
  return (config.controlTowerFrontendAllowedOrigins || []).some((allowed) => {
    if (allowed === origin) return true;
    if (allowed.startsWith('https://*.')) {
      const suffix = allowed.slice('https://*'.length);
      return origin.startsWith('https://') && origin.endsWith(suffix);
    }
    return false;
  });
};

const createControlTowerFrontendCors = (config = env) => (req, res, next) => {
  const origin = req.get('origin');
  if (origin && !isOriginAllowed(origin, config)) {
    return res.status(403).json({
      status: 'error',
      code: 'CONTROL_TOWER_FRONTEND_ORIGIN_DENIED',
      message: 'Control Tower frontend origin is not allowed.',
      sourceMode: 'disabled',
      readOnly: true,
      dryRun: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      auditId: `audit-frontend-cors-denied-${Date.now()}`,
      warnings: ['Configure CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS for this Lovable origin.'],
      data: {},
    });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-CornerOps-Frontend-Token, X-Request-Id, X-Correlation-Id',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '600');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
};

module.exports = { createControlTowerFrontendCors, isOriginAllowed };
