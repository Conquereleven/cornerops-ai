const { createHash } = require('crypto');

const CONTROLLED_ACTION_IDS = Object.freeze({
  GITHUB_ISSUE_CREATE: 'github.issue.create',
  INTERNAL_NOTE_CREATE: 'cornerops.note.create',
  INTERNAL_TASK_CREATE: 'cornerops.task.create',
});

const APPROVAL_EXECUTION_STATUS = Object.freeze({
  NOT_REQUESTED: 'not_requested',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  EXECUTING: 'executing',
  EXECUTED: 'executed',
  EXECUTION_FAILED: 'execution_failed',
  DRY_RUN_EXECUTED: 'dry_run_executed',
});

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
};

const stableStringify = (value) => JSON.stringify(stableValue(value));
const payloadChecksum = (value) => createHash('sha256').update(stableStringify(value)).digest('hex');
const normalizeIdempotencyText = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

const createActionError = (message, code, statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  APPROVAL_EXECUTION_STATUS,
  CONTROLLED_ACTION_IDS,
  createActionError,
  normalizeIdempotencyText,
  payloadChecksum,
  stableStringify,
};
