const ROLES = Object.freeze(['viewer', 'operator', 'founder']);
const MEMBERSHIP_STATUSES = Object.freeze(['active', 'disabled']);

// Minimum role per execution policy. A route without a policy is denied.
const POLICIES = Object.freeze({
  read: 'viewer',
  internal_write: 'operator',
  sensitive_config: 'founder',
  external_action: 'founder',
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{2,62}$/;

const isUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);
const isSlug = (value) => typeof value === 'string' && SLUG_PATTERN.test(value);

const roleSatisfies = (role, policy) => {
  const required = POLICIES[policy];
  if (!required) return false;
  const held = ROLES.indexOf(role);
  return held >= 0 && held >= ROLES.indexOf(required);
};

const identityError = (message, code, statusCode) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  MEMBERSHIP_STATUSES, POLICIES, ROLES, identityError, isSlug, isUuid, roleSatisfies,
};
