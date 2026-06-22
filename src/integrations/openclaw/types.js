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
  APPROVAL_STATUS,
  AUDIT_STATUS,
  CHANNELS,
  POLICY_DECISIONS,
};
