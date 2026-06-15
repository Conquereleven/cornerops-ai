const env = require('./env');

const hasSupabaseCredentials = Boolean(
  env.supabaseUrl && (env.supabaseServiceRoleKey || env.supabaseAnonKey),
);

const useSupabase =
  env.nodeEnv !== 'test' && env.useSupabase && hasSupabaseCredentials;

const supabaseServerKey =
  env.supabaseServiceRoleKey || env.supabaseAnonKey;

module.exports = {
  hasSupabaseCredentials,
  supabaseServerKey,
  useSupabase,
};
