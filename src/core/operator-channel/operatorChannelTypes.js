const OPERATOR_CHANNEL_PROVIDERS = Object.freeze([
  'mock',
  'telegram',
  'slack',
  'openclaw',
]);

const OPERATOR_CHANNEL_STATUSES = Object.freeze({
  SENT: 'sent',
  DRY_RUN: 'dry_run',
  BLOCKED: 'blocked',
  ERROR: 'error',
});

module.exports = {
  OPERATOR_CHANNEL_PROVIDERS,
  OPERATOR_CHANNEL_STATUSES,
};
