const DATA_SOURCE_IDS = Object.freeze([
  'leads',
  'quotes',
  'orders',
  'github',
  'audit_logs',
  'approvals',
  'agent_logs',
  'sync_status',
]);

const DATA_MODES = Object.freeze([
  'mock',
  'read_only',
  'draft_only',
  'approval_required',
  'write_enabled',
]);

const DATA_OPERATIONS = Object.freeze({
  READ: 'read',
  DRAFT: 'draft',
  PROPOSE_WRITE: 'propose_write',
  WRITE: 'write',
});

module.exports = {
  DATA_MODES,
  DATA_OPERATIONS,
  DATA_SOURCE_IDS,
};
