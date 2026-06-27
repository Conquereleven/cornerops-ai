const POLICY_DECISIONS = Object.freeze({
  ALLOWED: 'allowed',
  DRAFT_ONLY: 'draft_only',
  REQUIRES_CONFIRMATION: 'requires_confirmation',
  DENIED: 'denied',
});

const APPROVAL_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
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

const AUDIT_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUCCESS: 'success',
  ERROR: 'error',
});

const CHANNELS = Object.freeze(['whatsapp', 'telegram', 'slack']);

module.exports = {
  APPROVAL_EXECUTION_STATUS,
  APPROVAL_STATUS,
  AUDIT_STATUS,
  CHANNELS,
  POLICY_DECISIONS,
};
