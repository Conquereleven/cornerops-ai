const {
  CornerMexSupabaseReadOnlyConfig,
  DEFAULT_ENTITY_TABLES,
  DEFAULT_READ_VIEW_TABLES,
  LEGACY_ENTITY_TABLES,
  SOURCE_MODES,
  SUPABASE_STATUS,
  TABLE_AVAILABILITY,
  tableMappingCandidatesFromConfig,
  tableMappingsFromConfig,
} = require('./CornerMexSupabaseReadOnlyConfig');
const { CornerMexSupabaseReadOnlyClient } = require('./CornerMexSupabaseReadOnlyClient');
const {
  CornerMexSupabaseReadOnlyRepository,
  ENTITY_NAMES,
  classifyError,
  sanitizeErrorMessage,
} = require('./CornerMexSupabaseReadOnlyRepository');

module.exports = {
  CornerMexSupabaseReadOnlyClient,
  CornerMexSupabaseReadOnlyConfig,
  CornerMexSupabaseReadOnlyRepository,
  DEFAULT_ENTITY_TABLES,
  DEFAULT_READ_VIEW_TABLES,
  ENTITY_NAMES,
  LEGACY_ENTITY_TABLES,
  SOURCE_MODES,
  SUPABASE_STATUS,
  TABLE_AVAILABILITY,
  classifyError,
  sanitizeErrorMessage,
  tableMappingCandidatesFromConfig,
  tableMappingsFromConfig,
};
