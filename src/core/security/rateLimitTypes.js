const RATE_LIMIT_REASONS = Object.freeze({
  ALLOWED: 'allowed',
  EXCEEDED: 'rate_limit_exceeded',
  STORE_UNAVAILABLE: 'store_unavailable',
});

module.exports = { RATE_LIMIT_REASONS };
