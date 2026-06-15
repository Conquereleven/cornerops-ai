const { createClient } = require('@supabase/supabase-js');
const env = require('../../config/env');
const {
  hasSupabaseCredentials,
  supabaseServerKey,
  useSupabase,
} = require('../../config/supabase');

const isSupabaseEnabled = () => useSupabase;

const supabase = isSupabaseEnabled()
  ? createClient(env.supabaseUrl, supabaseServerKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      db: { schema: 'public' },
    })
  : null;

const getDataSourceStatus = () => ({
  mode: isSupabaseEnabled() ? 'supabase' : 'mock',
  requested: env.useSupabase,
  configured: hasSupabaseCredentials,
  credentialType: env.supabaseServiceRoleKey ? 'service_role' : (
    env.supabaseAnonKey ? 'anon' : 'none'
  ),
});

module.exports = {
  supabase,
  isSupabaseEnabled,
  getDataSourceStatus,
};
