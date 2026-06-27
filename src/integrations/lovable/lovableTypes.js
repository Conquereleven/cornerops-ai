const LOVABLE_SOURCE_MODES = Object.freeze({
  MISSING_CONFIG: 'missing_config',
  MOCK: 'mock',
  REPO_DISCOVERED: 'repo_discovered',
  REAL_READ_ONLY: 'real_read_only',
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
