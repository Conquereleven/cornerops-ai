const crypto = require('crypto');

const QUOTE_STATUSES = Object.freeze(['DRAFT', 'NEEDS_EVIDENCE', 'NEEDS_FOUNDER_APPROVAL', 'DRAFT_NOT_SENT', 'ARCHIVED']);
const checksum = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

class CanonicalInputPackService {
  validate({ b2bAccounts, skus } = {}) {
    const blockers = [];
    if (!Array.isArray(b2bAccounts) || b2bAccounts.length !== 10) blockers.push('canonical_b2b_10_account_pack_missing');
    if (!Array.isArray(skus) || skus.length !== 18) blockers.push('canonical_18_sku_pack_missing');
    return {
      status: blockers.length ? 'canonical_input_pack_missing' : 'validated', blockers,
      b2bAccountCount: Array.isArray(b2bAccounts) ? b2bAccounts.length : 0,
      skuCount: Array.isArray(skus) ? skus.length : 0,
      checksum: blockers.length ? null : checksum({ b2bAccounts, skus }),
      records: blockers.length ? { b2bAccounts: [], skus: [] } : { b2bAccounts, skus },
      inventedData: false, writesBlocked: true,
    };
  }

  buildQuoteQueue(pack = {}) {
    const validation = this.validate(pack);
    if (validation.status !== 'validated') return { ...validation, items: [] };
    return { ...validation, items: validation.records.b2bAccounts.map((account) => ({ id: `quote:${checksum(account).slice(0, 20)}`, accountId: account.id, status: 'NEEDS_EVIDENCE', sendStatus: 'DRAFT_NOT_SENT', externalSendAllowed: false })) };
  }
}

module.exports = { CanonicalInputPackService, QUOTE_STATUSES };
