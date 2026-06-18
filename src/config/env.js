const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const parsePort = (value) => {
  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 ? port : 3000;
};

const parseBoolean = (value) =>
  ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());

const parseEnum = (value, allowed, fallback) =>
  allowed.includes(String(value || '').toLowerCase())
    ? String(value).toLowerCase()
    : fallback;

const parseInteger = (value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
};

const parseCsv = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const baseEnv = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  frontendOrigin:
    process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  useSupabase: parseBoolean(process.env.USE_SUPABASE),
  internalApiKey: process.env.INTERNAL_API_KEY || '',
  allowInternalNoKey: parseBoolean(process.env.ALLOW_INTERNAL_NO_KEY),
  aiDefaultLanguage: parseEnum(
    process.env.AI_DEFAULT_LANGUAGE,
    ['es', 'en'],
    'es',
  ),
  aiWorkersMode: parseEnum(
    process.env.AI_WORKERS_MODE,
    ['mock', 'hybrid', 'supabase'],
    'hybrid',
  ),
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  whatsappWebhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || '',
  corneropsAgentsEnabled:
    process.env.CORNEROPS_AGENTS_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_AGENTS_ENABLED),
  corneropsAgentPackVersion:
    process.env.CORNEROPS_AGENT_PACK_VERSION || 'v0.1',
  corneropsDefaultAgent:
    process.env.CORNEROPS_DEFAULT_AGENT || 'cornerops-router-agent',
  corneropsDryRun:
    process.env.CORNEROPS_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_DRY_RUN),
  corneropsRequireApproval:
    process.env.CORNEROPS_REQUIRE_APPROVAL === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_REQUIRE_APPROVAL),
  corneropsAuditEnabled:
    process.env.CORNEROPS_AUDIT_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_AUDIT_ENABLED),
  corneropsAgentEnabledIds: parseCsv(process.env.CORNEROPS_AGENT_ENABLED_IDS),
  corneropsAgentDisabledIds: parseCsv(process.env.CORNEROPS_AGENT_DISABLED_IDS),
  corneropsAgentAllowedUsers: parseCsv(process.env.CORNEROPS_AGENT_ALLOWED_USERS),
  openclawEnabled: parseBoolean(process.env.OPENCLAW_ENABLED),
  openclawBaseUrl:
    process.env.OPENCLAW_BASE_URL || 'http://127.0.0.1:18789',
  openclawGatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN || '',
  openclawGatewayPassword: process.env.OPENCLAW_GATEWAY_PASSWORD || '',
  openclawDefaultModel:
    process.env.OPENCLAW_DEFAULT_MODEL || 'openclaw/default',
  openclawTimeoutMs: parseInteger(process.env.OPENCLAW_TIMEOUT_MS, 30000, {
    min: 1000,
    max: 120000,
  }),
  openclawMaxRetries: parseInteger(process.env.OPENCLAW_MAX_RETRIES, 2, {
    min: 0,
    max: 5,
  }),
  openclawDryRun:
    process.env.OPENCLAW_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.OPENCLAW_DRY_RUN),
  openclawRequireApproval:
    process.env.OPENCLAW_REQUIRE_APPROVAL === undefined
      ? true
      : parseBoolean(process.env.OPENCLAW_REQUIRE_APPROVAL),
  openclawAuditEnabled:
    process.env.OPENCLAW_AUDIT_ENABLED === undefined
      ? true
      : parseBoolean(process.env.OPENCLAW_AUDIT_ENABLED),
  openclawSandboxMode: process.env.OPENCLAW_SANDBOX_MODE || 'non-main',
  openclawAllowedChannels: parseCsv(
    process.env.OPENCLAW_ALLOWED_CHANNELS || 'whatsapp,telegram,slack',
  ),
  openclawAllowedUsers: parseCsv(process.env.OPENCLAW_ALLOWED_USERS),
  openclawAllowedTools: parseCsv(process.env.OPENCLAW_ALLOWED_TOOLS),
};

const getEnvWarnings = () => {
  const warnings = [];
  if (baseEnv.useSupabase && !baseEnv.supabaseUrl) {
    warnings.push('USE_SUPABASE=true but SUPABASE_URL is missing; mock fallback will be used.');
  }
  if (
    baseEnv.useSupabase &&
    !baseEnv.supabaseAnonKey &&
    !baseEnv.supabaseServiceRoleKey
  ) {
    warnings.push('USE_SUPABASE=true but Supabase keys are missing; mock fallback will be used.');
  }
  if (
    baseEnv.nodeEnv !== 'test' &&
    !baseEnv.internalApiKey &&
    !baseEnv.allowInternalNoKey
  ) {
    warnings.push('INTERNAL_API_KEY is missing; internal endpoints will remain locked.');
  }
  if (baseEnv.openclawEnabled && baseEnv.openclawDryRun) {
    warnings.push('OPENCLAW_ENABLED=true while OPENCLAW_DRY_RUN=true; tool execution will remain simulated.');
  }
  if (baseEnv.corneropsAgentsEnabled && baseEnv.corneropsDryRun) {
    warnings.push('CORNEROPS_AGENTS_ENABLED=true while CORNEROPS_DRY_RUN=true; agent execution will remain simulated.');
  }
  if (!baseEnv.corneropsRequireApproval) {
    warnings.push('CORNEROPS_REQUIRE_APPROVAL=false; only use this in isolated tests.');
  }
  if (
    baseEnv.openclawEnabled &&
    !baseEnv.openclawGatewayToken &&
    !baseEnv.openclawGatewayPassword
  ) {
    warnings.push('OPENCLAW_ENABLED=true without gateway auth; only use this on trusted localhost.');
  }
  return warnings;
};

module.exports = Object.freeze({ ...baseEnv, getEnvWarnings });
