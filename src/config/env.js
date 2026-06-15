const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const parsePort = (value) => {
  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 ? port : 3000;
};

const parseBoolean = (value) =>
  ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());

const env = Object.freeze({
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
});

module.exports = env;
