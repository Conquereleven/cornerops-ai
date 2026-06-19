const DATA_CONTRACT_ENTITIES = Object.freeze([
  'lead',
  'quote',
  'order',
  'audit_log',
  'approval',
]);

const CONFIDENCE_LEVELS = Object.freeze(['low', 'medium', 'high']);

module.exports = {
  CONFIDENCE_LEVELS,
  DATA_CONTRACT_ENTITIES,
};
