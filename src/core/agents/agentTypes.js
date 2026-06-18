const AGENT_PACK_VERSION = 'v0.1';

const AGENT_IDS = Object.freeze({
  ROUTER: 'cornerops-router-agent',
  DAILY_BRIEFING: 'daily-briefing-agent',
  B2B_SALES: 'b2b-sales-agent',
  QUOTES_ORDERS: 'quotes-orders-agent',
  DEV_CODEX_GITHUB: 'dev-codex-github-agent',
  SECURITY_AUDIT: 'security-audit-agent',
});

const AGENT_DOMAINS = Object.freeze({
  ROUTING: 'routing',
  BRIEFING: 'briefing',
  SALES: 'sales',
  ORDERS: 'orders',
  DEV: 'dev',
  SECURITY: 'security',
});

const CHANNELS = Object.freeze([
  'whatsapp',
  'telegram',
  'slack',
  'web',
  'internal',
]);

const PERMISSION_LEVELS = Object.freeze({
  READ_ONLY: 'read_only',
  DRAFT_ONLY: 'draft_only',
  APPROVAL_REQUIRED: 'approval_required',
  ADMIN_ONLY: 'admin_only',
});

const AGENT_STATUSES = Object.freeze({
  SUCCESS: 'success',
  NEEDS_APPROVAL: 'needs_approval',
  DENIED: 'denied',
  DRY_RUN: 'dry_run',
  ERROR: 'error',
});

const RISK_LEVELS = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

module.exports = {
  AGENT_DOMAINS,
  AGENT_IDS,
  AGENT_PACK_VERSION,
  AGENT_STATUSES,
  CHANNELS,
  PERMISSION_LEVELS,
  RISK_LEVELS,
};
