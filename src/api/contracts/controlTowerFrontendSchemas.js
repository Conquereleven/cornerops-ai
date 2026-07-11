const CONTROL_TOWER_FRONTEND_VERSION = 'v1.8';

const CONTROL_TOWER_FRONTEND_SECTIONS = [
  'status',
  'founder-daily',
  'cornermex',
  'flows',
  'approvals',
  'audit',
  'security',
  'telegram',
  'drafts',
  'actions',
];

const SECRET_KEY_PATTERN = /(token|secret|password|service[_-]?role|api[_-]?key|anon[_-]?key|bot[_-]?token|webhook[_-]?secret)/i;
const PII_KEY_PATTERN = /(email|phone|whatsapp|customerName|customer_name|contactName|contact_name)/i;

const maskString = (value) => {
  if (!value) return value;
  const text = String(value);
  if (text.length <= 4) return '***';
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
};

const sanitizeContractValue = (value) => {
  if (Array.isArray(value)) return value.map((item) => sanitizeContractValue(item));
  if (!value || typeof value !== 'object') return value;
  return Object.entries(value).reduce((acc, [key, nested]) => {
    if (SECRET_KEY_PATTERN.test(key)) {
      acc[key] = Boolean(nested);
      return acc;
    }
    if (PII_KEY_PATTERN.test(key) && typeof nested === 'string') {
      acc[key] = maskString(nested);
      return acc;
    }
    acc[key] = sanitizeContractValue(nested);
    return acc;
  }, {});
};

const createFrontendEnvelope = ({
  section,
  data = {},
  sourceMode = 'local_internal',
  status = 'success',
  auditId,
  warnings = [],
  approvalRequired = false,
} = {}) => ({
  status,
  sourceMode,
  readOnly: true,
  dryRun: true,
  writesBlocked: true,
  externalSendsBlocked: true,
  approvalRequired,
  auditId: auditId || `audit-frontend-${section || 'section'}-${Date.now()}`,
  warnings: [...new Set(warnings.filter(Boolean))],
  data: sanitizeContractValue(data),
});

const assertNoSecretKeys = (value) => {
  const json = JSON.stringify(value);
  return !/(xox[baprs]-|ghp_|github_pat_|sk-[A-Za-z0-9_-]{20,}|[0-9]{6,}:[A-Za-z0-9_-]{20,}|service_role_[A-Za-z0-9_-]{20,})/i.test(json);
};

module.exports = {
  CONTROL_TOWER_FRONTEND_SECTIONS,
  CONTROL_TOWER_FRONTEND_VERSION,
  assertNoSecretKeys,
  createFrontendEnvelope,
  sanitizeContractValue,
};
