const { createHash } = require('crypto');
const {
  CommercialInputPackService,
  REQUIRED_ACCOUNT_FIELDS,
  REQUIRED_SKU_FIELDS,
} = require('./CommercialInputPackService');
const { UNKNOWN_VALUES } = require('./commercialTypes');

const CLASSIFICATION = 'COMMERCIAL_PRODUCTION_CANDIDATE_NOT_IMPORTED';
const VERSION = 'commercial-input-v1.17b';
const TARGETS = Object.freeze({ accounts: 10, skus: 12 });
const EVIDENCE_FIELDS = Object.freeze(['evidenceSource', 'evidenceDate', 'verificationStatus', 'owner', 'updatedAt']);
const VERIFICATION_STATUSES = new Set([
  'source_verified',
  'partial_source_verified',
  'founder_attested',
  'pending_verification',
  'not_verified',
  'blocked',
]);
const DISALLOWED_UNKNOWN_MARKERS = new Set(['n/a', 'na', 'none', 'tbd', 'to_be_determined', 'not known']);
const UNKNOWN_SET = new Set(UNKNOWN_VALUES);

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
};
const checksum = (value) => createHash('sha256')
  .update(JSON.stringify(stableValue(value)))
  .digest('hex');
const hasPrivateContactData = (value) => {
  const text = String(value ?? '');
  return /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(text)
    || /(?:\+?\d[\d\s().-]{8,}\d)/.test(text);
};
const validTimestamp = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));

class CommercialProductionCandidateService {
  constructor({ inputPackService = new CommercialInputPackService() } = {}) {
    this.inputPackService = inputPackService;
  }

  validate(input) {
    const base = this.inputPackService.preview(input, {
      format: 'json',
      source: 'commercial_production_candidate_v1.17b',
    });
    const pack = base.records;
    const errors = [...base.errors];

    if (input?.classification !== CLASSIFICATION) {
      errors.push({ field: 'classification', code: 'PRODUCTION_CLASSIFICATION_REQUIRED' });
    }
    if (input?.version !== VERSION) {
      errors.push({ field: 'version', code: 'PRODUCTION_VERSION_REQUIRED' });
    }
    if (pack.accounts.length !== TARGETS.accounts) {
      errors.push({ field: 'accounts', code: 'PRODUCTION_ACCOUNT_TARGET_REQUIRED', expected: TARGETS.accounts });
    }
    if (pack.skus.length !== TARGETS.skus) {
      errors.push({ field: 'skus', code: 'PRODUCTION_SKU_TARGET_REQUIRED', expected: TARGETS.skus });
    }

    const inspect = (record, recordType, index, requiredFields) => {
      EVIDENCE_FIELDS.forEach((field) => {
        if (!(field in record) || record[field] === '' || record[field] === null) {
          errors.push({ type: recordType, index, field, code: 'EVIDENCE_FIELD_REQUIRED' });
        }
      });
      if (!validTimestamp(record.evidenceDate)) {
        errors.push({ type: recordType, index, field: 'evidenceDate', code: 'EVIDENCE_DATE_INVALID' });
      }
      if (!validTimestamp(record.updatedAt)) {
        errors.push({ type: recordType, index, field: 'updatedAt', code: 'UPDATED_AT_INVALID' });
      }
      if (!VERIFICATION_STATUSES.has(record.verificationStatus)) {
        errors.push({ type: recordType, index, field: 'verificationStatus', code: 'VERIFICATION_STATUS_INVALID' });
      }
      if (UNKNOWN_SET.has(record.evidenceSource)) {
        errors.push({ type: recordType, index, field: 'evidenceSource', code: 'EVIDENCE_SOURCE_REQUIRED' });
      }
      [...new Set([...requiredFields, ...EVIDENCE_FIELDS])].forEach((field) => {
        const value = record[field];
        if (DISALLOWED_UNKNOWN_MARKERS.has(String(value ?? '').trim().toLowerCase())) {
          errors.push({ type: recordType, index, field, code: 'UNKNOWN_MARKER_INVALID' });
        }
        if (!['accountId', 'skuId', 'source', 'evidenceSource', 'evidenceDate', 'updatedAt'].includes(field)
          && hasPrivateContactData(value)) {
          errors.push({ type: recordType, index, field, code: 'PRIVATE_CONTACT_DATA_NOT_ALLOWED' });
        }
      });
    };
    pack.accounts.forEach((record, index) => inspect(record, 'account', index, REQUIRED_ACCOUNT_FIELDS));
    pack.skus.forEach((record, index) => inspect(record, 'sku', index, REQUIRED_SKU_FIELDS));

    const measuredFields = [
      ...pack.accounts.map((record) => ({ record, fields: [...new Set([...REQUIRED_ACCOUNT_FIELDS, ...EVIDENCE_FIELDS])] })),
      ...pack.skus.map((record) => ({ record, fields: [...new Set([...REQUIRED_SKU_FIELDS, ...EVIDENCE_FIELDS])] })),
    ];
    const unknownFieldCount = measuredFields.reduce((total, { record, fields }) => (
      total + fields.filter((field) => UNKNOWN_SET.has(record[field])).length
    ), 0);
    const sourceBackedFieldCount = measuredFields.reduce((total, { record, fields }) => (
      total + fields.filter((field) => record[field] !== '' && record[field] !== null && !UNKNOWN_SET.has(record[field])).length
    ), 0);
    const normalized = {
      classification: CLASSIFICATION,
      version: VERSION,
      accounts: [...pack.accounts].sort((left, right) => left.accountId.localeCompare(right.accountId)),
      skus: [...pack.skus].sort((left, right) => left.skuId.localeCompare(right.skuId)),
    };

    return {
      status: errors.length ? 'validation_failed' : 'production_candidate_validated_not_imported',
      valid: errors.length === 0,
      classification: CLASSIFICATION,
      version: VERSION,
      checksum: checksum(normalized),
      counts: { accounts: pack.accounts.length, skus: pack.skus.length },
      unknownFieldCount,
      sourceBackedFieldCount,
      errors,
      writesPerformed: false,
      importAuthorized: false,
    };
  }
}

module.exports = {
  CLASSIFICATION,
  CommercialProductionCandidateService,
  EVIDENCE_FIELDS,
  TARGETS,
  VERSION,
};
