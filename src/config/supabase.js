const { createClient } = require('@supabase/supabase-js');
const env = require('./env');
const logger = require('../utils/logger');

let client;
let adminClient;

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  db: { schema: 'public' },
};

const isSupabaseConfigured = () =>
  Boolean(env.supabaseUrl && env.supabaseAnonKey);

const isSupabaseAdminConfigured = () =>
  Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);

const isSupabaseEnabled = () =>
  env.nodeEnv !== 'test' &&
  env.aiWorkersMode !== 'mock' &&
  env.useSupabase &&
  (isSupabaseConfigured() || isSupabaseAdminConfigured());

const getSupabaseClient = () => {
  if (!isSupabaseEnabled() || !isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions);
  }
  return client;
};

const getSupabaseAdminClient = () => {
  if (!isSupabaseEnabled() || !isSupabaseAdminConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(
      env.supabaseUrl,
      env.supabaseServiceRoleKey,
      clientOptions,
    );
  }
  return adminClient;
};

const getRepositoryClient = () =>
  getSupabaseAdminClient() || getSupabaseClient();

const logSupabaseConfiguration = () => {
  if (env.nodeEnv === 'test') return;
  if (env.useSupabase && !isSupabaseEnabled()) {
    logger.warn('supabase_disabled', {
      reason: 'missing_url_or_key',
      fallback: 'mock',
    });
  }
};

module.exports = {
  getRepositoryClient,
  getSupabaseAdminClient,
  getSupabaseClient,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
  isSupabaseEnabled,
  logSupabaseConfiguration,
};
