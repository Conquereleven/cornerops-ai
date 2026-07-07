#!/usr/bin/env node
require('./safe-cli-state-env');
const { serviceRoleLike } = require('../src/integrations/lovable/CornerMexLovableConfigValidator');

const classifySupabaseClientKey = (value = '') => {
  const key = String(value || '').trim();
  if (!key) return 'missing';
  if (serviceRoleLike(key) || /service[_-]?role/i.test(key) || /^sb_secret_/i.test(key)) return 'forbidden_secret';
  if (/^sb_publishable_/i.test(key)) return 'publishable';
  if (/^eyJ[A-Za-z0-9_-]+\./.test(key)) return 'legacy_anon_jwt';
  return 'unknown';
};

const isSafeForReadOnlyClient = (keyType) => ['legacy_anon_jwt', 'publishable', 'unknown'].includes(keyType);

const buildSupabaseKeyCompatibilityReport = (env = process.env) => {
  const key = env.CORNERMEX_SUPABASE_ANON_KEY || '';
  const keyType = classifySupabaseClientKey(key);
  const serviceRoleDetected = keyType === 'forbidden_secret';
  return {
    check: 'supabase_key_compatibility_v1.4.3',
    keyPresent: Boolean(String(key).trim()),
    keyType,
    urlPresent: Boolean(String(env.CORNERMEX_SUPABASE_URL || '').trim()),
    serviceRoleDetected,
    safeForReadOnlyClient: isSafeForReadOnlyClient(keyType),
    secretsPrinted: false,
  };
};

const main = () => {
  process.stdout.write(`${JSON.stringify(buildSupabaseKeyCompatibilityReport(), null, 2)}\n`);
};

if (require.main === module) main();

module.exports = {
  buildSupabaseKeyCompatibilityReport,
  classifySupabaseClientKey,
  isSafeForReadOnlyClient,
};
