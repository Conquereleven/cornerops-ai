const { sha256 } = require('./supplyGraphTypes');

const ENGINE_VERSION = 'supplygraph-match-v1.11.0';
const GENERIC_TOKENS = Object.freeze(['product', 'item', 'pack', 'mexican', 'original']);
const RULESET = Object.freeze({
  engineVersion: ENGINE_VERSION,
  weights: Object.freeze({ identity: 40, brand: 20, packUnit: 15, price: 10, temperature: 5, integrity: 10 }),
  thresholds: Object.freeze({ match: 70, ambiguous: 55 }),
  confidenceWeights: Object.freeze({ demand: 15, provenance: 20, priceFreshness: 15, stock: 20, moq: 10, leadTime: 10, shelfTemperature: 10 }),
  confidenceCaps: Object.freeze({ stockUnknown: 65, moqAndLeadUnknown: 60, stalePrice: 55, ambiguousIdentity: 50 }),
  genericTokens: GENERIC_TOKENS,
});

const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const RULESET_CHECKSUM = sha256(stable(RULESET));

const normalizeMatchText = (value) => String(value || '').normalize('NFKD').toLowerCase()
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const significantTokens = (value) => [...new Set(normalizeMatchText(value).split(' ')
  .filter((token) => token && token.length > 1 && !GENERIC_TOKENS.includes(token)))].sort();

module.exports = { ENGINE_VERSION, RULESET, RULESET_CHECKSUM, normalizeMatchText, significantTokens, stable };
