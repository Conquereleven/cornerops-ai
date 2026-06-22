const DATABASE_PROVIDERS = Object.freeze(['mock', 'supabase', 'postgres', 'unknown']);
const PII_GUESSES = Object.freeze(['none', 'low', 'medium', 'high']);

const piiGuessForColumn = (name) => {
  const value = String(name || '').toLowerCase();
  if (/(password|secret|token|card|iban|account)/.test(value)) return 'high';
  if (/(email|phone|mobile|whatsapp|address|contact.?name|customer.?name)/.test(value)) return 'high';
  if (/(name|notes|message|city|country)/.test(value)) return 'medium';
  if (/(company|source|status)/.test(value)) return 'low';
  return 'none';
};

const jsType = (value) => {
  if (value === null || value === undefined) return 'unknown';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'timestamp';
  return typeof value;
};

module.exports = {
  DATABASE_PROVIDERS,
  PII_GUESSES,
  jsType,
  piiGuessForColumn,
};
