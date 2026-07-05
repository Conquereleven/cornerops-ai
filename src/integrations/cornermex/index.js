const {
  CornerMexSupabaseReadOnlyConfig,
  DEFAULT_ENTITY_TABLES,
  SOURCE_MODES,
  SUPABASE_STATUS,
  TABLE_AVAILABILITY,
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
  ENTITY_NAMES,
  SOURCE_MODES,
  SUPABASE_STATUS,
  TABLE_AVAILABILITY,
  classifyError,
  sanitizeErrorMessage,
  tableMappingsFromConfig,
};
