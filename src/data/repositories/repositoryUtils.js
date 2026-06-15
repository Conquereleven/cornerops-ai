const logger = require('../../utils/logger');

const clampLimit = (value, fallback = 100, maximum = 1000) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maximum);
};

const parseOptionalBoolean = (value) => {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
};

const throwSupabaseError = (error, operation) => {
  if (!error) return;
  const wrapped = new Error(`Supabase ${operation} failed: ${error.message}`);
  wrapped.statusCode = 502;
  wrapped.code = error.code;
  throw wrapped;
};

const compact = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );

const trySupabase = async (operation, action) => {
  try {
    return { ok: true, value: await action() };
  } catch (error) {
    logger.warn('supabase_repository_fallback', {
      operation,
      message: error.message,
      code: error.code,
    });
    return { ok: false, value: null };
  }
};

module.exports = {
  clampLimit,
  parseOptionalBoolean,
  throwSupabaseError,
  compact,
  trySupabase,
};
