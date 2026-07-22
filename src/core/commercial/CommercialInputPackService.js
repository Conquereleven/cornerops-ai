const { createHash } = require('crypto');
const { commercialError, UNKNOWN_VALUES } = require('./commercialTypes');

const REQUIRED_ACCOUNT_FIELDS = Object.freeze([
  'accountId', 'legalName', 'displayName', 'accountType', 'emirate', 'city', 'channel',
  'contactStatus', 'commercialStatus', 'owner', 'priority', 'paymentTerms', 'deliveryTerms',
  'notes', 'source', 'updatedAt',
]);
const REQUIRED_SKU_FIELDS = Object.freeze([
  'skuId', 'name', 'brand', 'category', 'supplier', 'supplierSku', 'unit', 'casePack',
  'costCurrency', 'unitCost', 'sellingCurrency', 'suggestedB2BPrice', 'minimumOrderQuantity',
  'inventoryStatus', 'registrationStatus', 'commercialStatus', 'source', 'updatedAt',
]);
const CURRENCIES = new Set(['AED', 'USD', 'EUR', 'MXN', ...UNKNOWN_VALUES]);

const normalize = (value) => String(value ?? '').trim();
const canonical = (value) => JSON.stringify(value, Object.keys(value).sort());
const checksum = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const parseCsvLine = (line) => {
  const cells = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { cells.push(value); value = ''; }
    else value += character;
  }
  cells.push(value);
  return cells.map((cell) => cell.trim());
};
const parseCsv = (text) => {
  const lines = String(text || '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, parseCsvLine(line)[index] ?? ''])));
};
const moneyValid = (value) => UNKNOWN_VALUES.includes(value) || (typeof value === 'number' && Number.isFinite(value) && value >= 0);

class CommercialInputPackService {
  parse(input, format = 'json') {
    if (format === 'json') return typeof input === 'string' ? JSON.parse(input) : input;
    if (format !== 'csv') throw commercialError('Input format must be json or csv.', 'COMMERCIAL_INPUT_FORMAT_INVALID');
    const rows = parseCsv(input);
    const numeric = new Set(['unitCost', 'suggestedB2BPrice', 'minimumOrderQuantity', 'casePack']);
    const coerce = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [
      key, numeric.has(key) && value !== '' && Number.isFinite(Number(value)) ? Number(value) : value,
    ]));
    return {
      version: 'commercial-input-v1.17a',
      accounts: rows.filter((row) => row.recordType === 'account').map(({ recordType: _ignored, ...row }) => coerce(row)),
      skus: rows.filter((row) => row.recordType === 'sku').map(({ recordType: _ignored, ...row }) => coerce(row)),
    };
  }

  preview(input, { format = 'json', source = 'founder_authorized_input' } = {}) {
    let pack;
    try { pack = this.parse(input, format); } catch (error) {
      if (error.code) throw error;
      throw commercialError('Input pack could not be parsed.', 'COMMERCIAL_INPUT_PARSE_FAILED');
    }
    const accounts = Array.isArray(pack?.accounts) ? pack.accounts : [];
    const skus = Array.isArray(pack?.skus) ? pack.skus : [];
    const errors = [];
    const seenAccounts = new Set();
    const seenSkus = new Set();
    const validate = (record, fields, type, index, seen, idField) => {
      const id = normalize(record?.[idField]);
      if (!id) errors.push({ type, index, field: idField, code: 'ID_REQUIRED' });
      if (id && seen.has(id)) errors.push({ type, index, field: idField, code: 'DUPLICATE_ID' });
      seen.add(id);
      fields.forEach((field) => {
        if (!(field in (record || {})) || record[field] === '' || record[field] === null) {
          errors.push({ type, index, field, code: 'FIELD_REQUIRED_OR_EXPLICIT_UNKNOWN' });
        }
      });
      return { ...record, [idField]: id, source: normalize(record?.source || source) };
    };
    const normalizedAccounts = accounts.map((record, index) => validate(record, REQUIRED_ACCOUNT_FIELDS, 'account', index, seenAccounts, 'accountId'));
    const normalizedSkus = skus.map((record, index) => {
      const item = validate(record, REQUIRED_SKU_FIELDS, 'sku', index, seenSkus, 'skuId');
      if (!CURRENCIES.has(item.costCurrency)) errors.push({ type: 'sku', index, field: 'costCurrency', code: 'CURRENCY_INVALID' });
      if (!CURRENCIES.has(item.sellingCurrency)) errors.push({ type: 'sku', index, field: 'sellingCurrency', code: 'CURRENCY_INVALID' });
      if (!moneyValid(item.unitCost)) errors.push({ type: 'sku', index, field: 'unitCost', code: 'MONEY_INVALID' });
      if (!moneyValid(item.suggestedB2BPrice)) errors.push({ type: 'sku', index, field: 'suggestedB2BPrice', code: 'MONEY_INVALID' });
      return item;
    });
    const normalizedPack = {
      version: normalize(pack?.version || 'commercial-input-v1.17a'),
      source, accounts: normalizedAccounts, skus: normalizedSkus,
    };
    return {
      status: errors.length ? 'validation_failed' : 'ready_for_confirmation',
      valid: errors.length === 0,
      checksum: checksum({ ...normalizedPack, accounts: [...normalizedAccounts].sort((a, b) => canonical(a).localeCompare(canonical(b))), skus: [...normalizedSkus].sort((a, b) => canonical(a).localeCompare(canonical(b))) }),
      coverage: {
        accountCount: accounts.length, skuCount: skus.length, minimumAccounts: 1, minimumSkus: 1,
        priorityAccountsTarget: 10, launchSkusTarget: 18,
        accountsTargetComplete: accounts.length >= 10, skusTargetComplete: skus.length >= 18,
      },
      errors,
      records: normalizedPack,
      writesPerformed: false,
    };
  }
}

module.exports = { CommercialInputPackService, REQUIRED_ACCOUNT_FIELDS, REQUIRED_SKU_FIELDS, parseCsv };
