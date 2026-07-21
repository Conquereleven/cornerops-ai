const crypto = require('crypto');

const QUOTE_STATUSES = Object.freeze(['DRAFT', 'NEEDS_EVIDENCE', 'NEEDS_FOUNDER_APPROVAL', 'DRAFT_NOT_SENT', 'ARCHIVED']);
const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
};
const checksum = (value) => crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const plainRecord = (record) => record !== null && typeof record === 'object' && !Array.isArray(record)
  && (Object.getPrototypeOf(record) === Object.prototype || Object.getPrototypeOf(record) === null);
const safeRecord = (record) => plainRecord(record)
  && !['__proto__', 'prototype', 'constructor'].some((key) => Object.prototype.hasOwnProperty.call(record, key))
  && typeof record.id === 'string' && record.id.trim().length > 0 && record.id.length <= 120
  && Object.values(record).every((value) => typeof value !== 'string' || value.length <= 500);

class CanonicalInputPackService {
  validate({ b2bAccounts, skus } = {}) {
    const blockers = [];
    if (!Array.isArray(b2bAccounts) || b2bAccounts.length !== 10) blockers.push('canonical_b2b_10_account_pack_missing');
    if (!Array.isArray(skus) || skus.length !== 18) blockers.push('canonical_18_sku_pack_missing');
    if (Array.isArray(b2bAccounts) && !b2bAccounts.every(safeRecord)) blockers.push('canonical_b2b_records_invalid');
    if (Array.isArray(skus) && !skus.every(safeRecord)) blockers.push('canonical_sku_records_invalid');
    if (Array.isArray(b2bAccounts) && new Set(b2bAccounts.filter(plainRecord).map((item) => item.id)).size !== b2bAccounts.length) blockers.push('canonical_b2b_ids_duplicate');
    if (Array.isArray(skus) && new Set(skus.filter(plainRecord).map((item) => item.id)).size !== skus.length) blockers.push('canonical_sku_ids_duplicate');
    return {
      status: blockers.length ? 'canonical_input_pack_missing' : 'validated', blockers,
      b2bAccountCount: Array.isArray(b2bAccounts) ? b2bAccounts.length : 0,
      skuCount: Array.isArray(skus) ? skus.length : 0,
      checksum: blockers.length ? null : checksum({ b2bAccounts, skus }),
      records: blockers.length ? { b2bAccounts: [], skus: [] } : JSON.parse(JSON.stringify({ b2bAccounts, skus })),
      inventedData: false, writesBlocked: true,
    };
  }

  buildQuoteQueue(pack = {}) {
    const validation = this.validate(pack);
    if (validation.status !== 'validated') return { ...validation, items: [] };
    return { ...validation, wiringStatus: 'wired_read_only_fail_closed', items: validation.records.b2bAccounts.map((account) => ({ id: `quote:${checksum(account).slice(0, 20)}`, accountId: account.id, status: 'NEEDS_EVIDENCE', sendStatus: 'DRAFT_NOT_SENT', externalSendAllowed: false })) };
  }
}

module.exports = { CanonicalInputPackService, QUOTE_STATUSES };
