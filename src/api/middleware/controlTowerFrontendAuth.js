const crypto = require('crypto');
const { timingSafeEqual } = require('crypto');
const env = require('../../config/env');

const normalizeHash = (hash) => String(hash || '').replace(/^sha256:/i, '').trim().toLowerCase();

const sha256 = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

const safeHashEqual = (providedToken, expectedHash) => {
  const left = Buffer.from(sha256(providedToken), 'hex');
  const rightHash = normalizeHash(expectedHash);
  if (!/^[a-f0-9]{64}$/.test(rightHash)) return false;
  const right = Buffer.from(rightHash, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
};

const providedToken = (req) => {
  const bearer = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  return bearer || req.get('x-cornerops-frontend-token') || '';
};

const bridgeAuditId = (reason) => `audit-frontend-bridge-${reason}-${Date.now()}`;

const safeError = (res, status, code, message, reason) => res.status(status).json({
  status: 'error',
  code,
  message,
  sourceMode: 'disabled',
  readOnly: true,
  dryRun: true,
  writesBlocked: true,
  externalSendsBlocked: true,
  auditId: bridgeAuditId(reason || code),
  warnings: [message],
  data: {},
});

const validateBridgeSafety = (config) => (
  config.controlTowerFrontendReadOnly
  && config.controlTowerFrontendFailClosed
  && config.controlTowerFrontendMaskPii
  && config.controlTowerFrontendAuditRequests
);

const createControlTowerFrontendAuth = (config = env) => (req, res, next) => {
  if (!config.controlTowerFrontendApiEnabled) {
    return safeError(
      res,
      503,
      'CONTROL_TOWER_FRONTEND_API_DISABLED',
      'Control Tower frontend API bridge is disabled.',
      'disabled',
    );
  }
  if (!validateBridgeSafety(config)) {
    return safeError(
      res,
      503,
      'CONTROL_TOWER_FRONTEND_UNSAFE_CONFIG',
      'Control Tower frontend API bridge safety configuration is invalid.',
      'unsafe-config',
    );
  }
  if (!config.controlTowerFrontendAuthRequired) {
    req.controlTowerFrontendAuth = {
      auditId: bridgeAuditId('auth-not-required'),
      authMode: config.controlTowerFrontendAuthMode,
      authenticated: true,
      tokenFingerprint: 'auth-disabled',
    };
    return next();
  }
  if (!config.controlTowerFrontendTokenHash) {
    return safeError(
      res,
      503,
      'CONTROL_TOWER_FRONTEND_TOKEN_HASH_MISSING',
      'Control Tower frontend operator token hash is not configured.',
      'token-hash-missing',
    );
  }
  const token = providedToken(req);
  if (!token) {
    return safeError(
      res,
      401,
      'CONTROL_TOWER_FRONTEND_TOKEN_MISSING',
      'Missing Control Tower frontend operator token.',
      'missing-token',
    );
  }
  if (!safeHashEqual(token, config.controlTowerFrontendTokenHash)) {
    return safeError(
      res,
      403,
      'CONTROL_TOWER_FRONTEND_TOKEN_INVALID',
      'Invalid Control Tower frontend operator token.',
      'invalid-token',
    );
  }
  req.controlTowerFrontendAuth = {
    auditId: bridgeAuditId('auth-ok'),
    authMode: config.controlTowerFrontendAuthMode,
    authenticated: true,
    tokenFingerprint: sha256(token).slice(0, 12),
  };
  return next();
};

module.exports = {
  createControlTowerFrontendAuth,
  normalizeHash,
  providedToken,
  safeHashEqual,
  sha256,
};
