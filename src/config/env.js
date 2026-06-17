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
  return warnings;
};

module.exports = Object.freeze({ ...baseEnv, getEnvWarnings });
