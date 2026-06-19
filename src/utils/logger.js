const env = require('../config/env');
const {
  sanitizeLogMetadata,
  sanitizeMessage,
} = require('../core/security/SecuritySanitizer');

const log = (level, message, metadata = {}) => {
  const safeMetadata = env.corneropsLogSanitization
    ? sanitizeLogMetadata(metadata, { maxBytes: env.corneropsMaxAuditPayloadBytes })
    : metadata;
  const safeMessage = env.corneropsLogSanitization ? sanitizeMessage(message) : message;
  const payload = { timestamp: new Date().toISOString(), message: safeMessage, ...safeMetadata };
  console[level](JSON.stringify(payload));
};

module.exports = {
  info: (message, metadata) => log('info', message, metadata),
  warn: (message, metadata) => log('warn', message, metadata),
  error: (message, metadata) => log('error', message, metadata),
};
