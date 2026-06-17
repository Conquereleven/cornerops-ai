const env = require('../../config/env');
const {
  getRepositoryClient,
  getSupabaseAdminClient,
  getSupabaseClient,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
  isSupabaseEnabled,
} = require('../../config/supabase');

const supabase = getRepositoryClient();

const getDataSourceStatus = () => ({
  mode: isSupabaseEnabled() ? 'supabase' : 'mock',
  requested: env.useSupabase,
  configured: isSupabaseConfigured() || isSupabaseAdminConfigured(),
  credentialType: isSupabaseAdminConfigured()
    ? 'service_role'
    : isSupabaseConfigured() ? 'anon' : 'none',
});

module.exports = {
  supabase,
  getDataSourceStatus,
  getSupabaseAdminClient,
  getSupabaseClient,
  isSupabaseConfigured,
  isSupabaseEnabled,
};
