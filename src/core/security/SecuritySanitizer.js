const DEFAULT_MAX_BYTES = 12000;
const MAX_DEPTH = 8;

const SENSITIVE_KEY_PARTS = [
  'authorization',
  'cookie',
  'password',
  'secret',
  'service_role',
  'token',
  'api_key',
  'apikey',
  'access_key',
  'session',
];

const PERSISTENCE_SENSITIVE_KEY_PARTS = [
  'authorization',
  'cookie',
  'password',
  'secret',
  'service_role',
  'token',
  'api_key',
  'apikey',
  'access_key',
  'private_key',
  'credential',
];

const PRIVATE_CONTENT_KEYS = new Set([
  'body',
  'content',
  'message',
  'messages',
  'rawbody',
  'rawmessage',
  'rawpayload',
  'text',
  'thread',
  'transcript',
]);

const isSensitiveKey = (key) => {
  const normalized = String(key || '').toLowerCase();
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
};

const isPersistenceSensitiveKey = (key) => {
  const normalized = String(key || '').toLowerCase();
  if (normalized === 'tokens') return false;
  return PERSISTENCE_SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
};

const maskEmail = (value) => {
  const email = String(value || '');
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
};

const maskPhone = (value) => {
  const phone = String(value || '');
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return phone;
  return `${phone.slice(0, 3)}******${digits.slice(-4)}`;
};

const maskPiiInString = (value) => String(value || '')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => maskEmail(email))
  .replace(/\+\d[\d\s().-]{6,}\d/g, (candidate) => maskPhone(candidate));

const sanitizeMessage = (value) => maskPiiInString(value)
  .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
  .replace(/\b(?:ghp_|github_pat_|sbp_|sk-)[A-Za-z0-9_-]+\b/g, '[REDACTED]')
  .replace(/\b\d{6,12}:[A-Za-z0-9_-]{20,}\b/g, '[REDACTED_TELEGRAM_TOKEN]')
  .replace(/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[REDACTED_JWT]');

const sanitizeValue = (value, {
  depth = 0,
  key = '',
  redactPrivateContent = false,
} = {}) => {
  if (depth > MAX_DEPTH) return '[TRUNCATED_DEPTH]';
  if (isSensitiveKey(key)) return '[REDACTED]';
  if (redactPrivateContent && PRIVATE_CONTENT_KEYS.has(String(key).toLowerCase())) {
    return '[REDACTED_PRIVATE_CONTENT]';
  }
  if (typeof value === 'string') return sanitizeMessage(value);
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, {
      depth: depth + 1,
      redactPrivateContent,
    }));
  }
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([entryKey, entry]) => [
    entryKey,
    sanitizeValue(entry, {
      depth: depth + 1,
      key: entryKey,
      redactPrivateContent,
    }),
  ]));
};

const sanitizePersistenceValue = (value, { depth = 0, key = '' } = {}) => {
  if (depth > MAX_DEPTH) return '[TRUNCATED_DEPTH]';
  if (isPersistenceSensitiveKey(key)) return '[REDACTED]';
  if (typeof value === 'string') return sanitizeMessage(value);
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePersistenceValue(item, { depth: depth + 1 }));
  }
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([entryKey, entry]) => [
    entryKey,
    sanitizePersistenceValue(entry, { depth: depth + 1, key: entryKey }),
  ]));
};

const truncatePayload = (value, maxBytes = DEFAULT_MAX_BYTES) => {
  const serialized = JSON.stringify(value);
  const bytes = Buffer.byteLength(serialized, 'utf8');
  if (bytes <= maxBytes) return value;
  return {
    truncated: true,
    originalBytes: bytes,
    preview: serialized.slice(0, Math.max(0, maxBytes - 128)),
  };
};

const sanitizeAuditPayload = (value, { maxBytes = DEFAULT_MAX_BYTES } = {}) =>
  truncatePayload(sanitizeValue(value, { redactPrivateContent: true }), maxBytes);

const sanitizeLogMetadata = (value, { maxBytes = DEFAULT_MAX_BYTES } = {}) =>
  truncatePayload(sanitizeValue(value, { redactPrivateContent: true }), maxBytes);

const sanitizePersistencePayload = (value) => sanitizePersistenceValue(value);

module.exports = {
  DEFAULT_MAX_BYTES,
  PRIVATE_CONTENT_KEYS,
  PERSISTENCE_SENSITIVE_KEY_PARTS,
  SENSITIVE_KEY_PARTS,
  isPersistenceSensitiveKey,
  isSensitiveKey,
  maskEmail,
  maskPhone,
  maskPiiInString,
  sanitizeAuditPayload,
  sanitizeLogMetadata,
  sanitizeMessage,
  sanitizePersistencePayload,
  sanitizePersistenceValue,
  sanitizeValue,
  truncatePayload,
};
