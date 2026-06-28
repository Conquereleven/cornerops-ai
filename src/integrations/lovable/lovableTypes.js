const LOVABLE_SOURCE_MODES = Object.freeze({
  MISSING_CONFIG: 'missing_config',
  MOCK: 'mock',
  REPO_DISCOVERED: 'repo_discovered',
  SCHEMA_DISCOVERED: 'schema_discovered',
  REAL_READ_ONLY: 'real_read_only',
  BLOCKED_UNSAFE_CONFIG: 'blocked_unsafe_config',
});

const LOVABLE_DISCOVERY_MODES = Object.freeze(['mock', 'repo', 'supabase', 'auto']);

const CORNERMEX_ENTITIES = Object.freeze([
  'product',
  'lead',
  'quote',
  'order',
  'customer',
  'payment',
  'internal_note',
]);

module.exports = {
  CORNERMEX_ENTITIES,
  LOVABLE_DISCOVERY_MODES,
  LOVABLE_SOURCE_MODES,
};
