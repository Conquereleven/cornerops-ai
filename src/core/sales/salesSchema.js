const { isUuid } = require('../identity/policy');

const STAGES = Object.freeze(['new', 'contacted', 'engaged', 'discovery', 'qualified', 'proposal', 'won', 'lost', 'nurture']);
const OPEN_STAGES = Object.freeze(STAGES.filter((stage) => !['won', 'lost'].includes(stage)));
const ACCOUNT_STATUSES = Object.freeze(['prospect', 'active', 'customer', 'disqualified', 'archived']);
const PRIORITIES = Object.freeze(['high', 'medium', 'low']);
const CONFIDENCE = Object.freeze(['verified', 'likely', 'unverified']);
const ACTIVITY_TYPES = Object.freeze(['email', 'call', 'whatsapp', 'linkedin', 'meeting', 'note']);
const DIRECTIONS = Object.freeze(['inbound', 'outbound', 'internal']);

const text = (max, options = {}) => ({ kind: 'text', max, ...options });
const choice = (values, options = {}) => ({ kind: 'choice', values, ...options });
const score = () => ({ kind: 'integer', min: 0, max: 100 });

// Client-writable fields only. workspace_id, created_by, updated_by and ids are
// always set by the server and are rejected if a client sends them.
const ENTITIES = Object.freeze({
  account: {
    table: 'sales_accounts',
    fields: {
      name: text(200, { required: true }),
      website: text(300),
      segment: text(80),
      source: text(80),
      priority: choice(PRIORITIES),
      fitScore: score(),
      status: choice(ACCOUNT_STATUSES),
      ownerUserId: { kind: 'uuid' },
      problemHypothesis: text(2000),
    },
  },
  contact: {
    table: 'sales_contacts',
    fields: {
      name: text(200, { required: true }),
      title: text(160),
      email: text(320, { pattern: /^[^@\s]+@[^@\s]+$/ }),
      phone: text(40),
      linkedinUrl: text(300),
      contactConfidence: choice(CONFIDENCE),
      isPrimary: { kind: 'boolean' },
    },
  },
  opportunity: {
    table: 'sales_opportunities',
    fields: {
      stage: choice(STAGES),
      problemSummary: text(2000),
      solutionHypothesis: text(2000),
      currency: text(3, { pattern: /^[A-Z]{3}$/ }),
      estimatedValue: { kind: 'money' },
      qualificationScore: score(),
      nextStep: text(500),
      nextStepAt: { kind: 'timestamp' },
      ownerUserId: { kind: 'uuid' },
    },
  },
  activity: {
    table: 'sales_activities',
    fields: {
      type: choice(ACTIVITY_TYPES, { required: true }),
      direction: choice(DIRECTIONS),
      occurredAt: { kind: 'timestamp' },
      outcome: text(200),
      notes: text(5000),
      externalRef: text(300),
      contactId: { kind: 'uuid' },
      opportunityId: { kind: 'uuid' },
    },
  },
});

const salesError = (message, code, statusCode = 400, fields) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  if (fields) error.fields = fields;
  return error;
};

const snake = (key) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const camel = (key) => key.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());

const coerce = (rule, value) => {
  if (value === null || value === undefined || value === '') return { value: null };
  switch (rule.kind) {
    case 'text': {
      if (typeof value !== 'string') return { error: 'must be text' };
      const trimmed = value.trim();
      if (!trimmed) return { value: null };
      if (trimmed.length > rule.max) return { error: `must be at most ${rule.max} characters` };
      if (rule.pattern && !rule.pattern.test(trimmed)) return { error: 'has an invalid format' };
      return { value: trimmed };
    }
    case 'choice':
      return rule.values.includes(value) ? { value } : { error: `must be one of: ${rule.values.join(', ')}` };
    case 'integer':
      return Number.isInteger(value) && value >= rule.min && value <= rule.max
        ? { value } : { error: `must be a whole number between ${rule.min} and ${rule.max}` };
    case 'money':
      return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 1e12
        ? { value: Math.round(value * 100) / 100 } : { error: 'must be a non-negative number' };
    case 'boolean':
      return typeof value === 'boolean' ? { value } : { error: 'must be true or false' };
    case 'uuid':
      return isUuid(value) ? { value } : { error: 'must be a valid id' };
    case 'timestamp': {
      const time = typeof value === 'string' ? Date.parse(value) : Number.NaN;
      return Number.isNaN(time) ? { error: 'must be an ISO date' } : { value: new Date(time).toISOString() };
    }
    default:
      return { error: 'is not supported' };
  }
};

// Returns a column map ready to persist. Error messages name fields and rules,
// never the submitted values, so they are safe to log.
const validate = (entity, input, { partial = false } = {}) => {
  const definition = ENTITIES[entity];
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw salesError('Request body must be an object.', 'SALES_VALIDATION_FAILED', 400, { body: 'must be an object' });
  }
  for (const key of Object.keys(input)) {
    if (!definition.fields[key]) errors[key] = 'is not an editable field';
  }
  const columns = {};
  for (const [key, rule] of Object.entries(definition.fields)) {
    const provided = Object.prototype.hasOwnProperty.call(input, key);
    if (!provided) {
      if (rule.required && !partial) errors[key] = 'is required';
      continue;
    }
    const result = coerce(rule, input[key]);
    if (result.error) errors[key] = result.error;
    else if (result.value === null && rule.required) errors[key] = 'is required';
    else columns[snake(key)] = result.value;
  }
  if (Object.keys(errors).length) {
    throw salesError('Some fields are invalid.', 'SALES_VALIDATION_FAILED', 400, errors);
  }
  if (partial && !Object.keys(columns).length) {
    throw salesError('No editable fields were provided.', 'SALES_VALIDATION_FAILED', 400, { body: 'has no editable fields' });
  }
  return columns;
};

const toApi = (row) => row && Object.fromEntries(Object.entries(row)
  .filter(([key]) => !['workspace_id', 'external_send_performed'].includes(key))
  .map(([key, value]) => [camel(key), key === 'estimated_value' && value !== null ? Number(value) : value]));

module.exports = {
  ACCOUNT_STATUSES, ACTIVITY_TYPES, CONFIDENCE, DIRECTIONS, ENTITIES, OPEN_STAGES, PRIORITIES, STAGES,
  camel, salesError, snake, toApi, validate,
};
