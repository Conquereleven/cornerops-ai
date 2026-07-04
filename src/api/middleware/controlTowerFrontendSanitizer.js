const env = require('../../config/env');
const { sanitizeContractValue, assertNoSecretKeys } = require('../contracts/controlTowerFrontendSchemas');

const createControlTowerFrontendSanitizer = (config = env) => (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    const sanitized = sanitizeContractValue(payload);
    const json = JSON.stringify(sanitized);
    const maxBytes = (config.controlTowerFrontendMaxPayloadKb || 256) * 1024;
    if (Buffer.byteLength(json, 'utf8') > maxBytes) {
      return originalJson({
        status: 'error',
        code: 'CONTROL_TOWER_FRONTEND_PAYLOAD_TOO_LARGE',
        message: 'Control Tower frontend payload exceeded the configured size limit.',
        sourceMode: 'disabled',
        readOnly: true,
        dryRun: true,
        writesBlocked: true,
        externalSendsBlocked: true,
        auditId: `audit-frontend-payload-large-${Date.now()}`,
        warnings: ['Payload was blocked before leaving the backend.'],
        data: {},
      });
    }
    if (!assertNoSecretKeys(sanitized)) {
      return originalJson({
        status: 'error',
        code: 'CONTROL_TOWER_FRONTEND_SECRET_BLOCKED',
        message: 'Control Tower frontend payload failed secret exposure checks.',
        sourceMode: 'disabled',
        readOnly: true,
        dryRun: true,
        writesBlocked: true,
        externalSendsBlocked: true,
        auditId: `audit-frontend-secret-blocked-${Date.now()}`,
        warnings: ['A secret-like value was removed by fail-closed response sanitization.'],
        data: {},
      });
    }
    return originalJson(sanitized);
  };
  return next();
};

module.exports = { createControlTowerFrontendSanitizer };
