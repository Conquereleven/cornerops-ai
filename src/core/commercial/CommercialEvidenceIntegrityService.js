const { createHash } = require('crypto');
const { commercialError } = require('./commercialTypes');

const CHECKSUM = /^[a-f0-9]{64}$/i;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const BINDING_FIELDS = Object.freeze([
  'subjectType', 'subjectId', 'orderId', 'fulfillmentId', 'paymentMethod',
  'previousState', 'newState', 'amount', 'currency',
]);

const normalizedText = (value, upper = false) => {
  const result = String(value ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '_').trim().replace(/\s+/g, ' ');
  return upper ? result.toUpperCase() : result.toLowerCase();
};
const canonicalJson = (value) => JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))));
const same = (left, right) => String(left ?? '') === String(right ?? '');
const sameBinding = (field, left, right) => {
  if (field === 'amount') {
    try { return moneyToMinor(left) === moneyToMinor(right); } catch (_error) { return false; }
  }
  if (field === 'currency' || field === 'paymentMethod') return normalizedText(left, true) === normalizedText(right, true);
  return same(String(left ?? '').trim(), String(right ?? '').trim());
};

const moneyToMinor = (value, { allowZero = false } = {}) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw commercialError(`Payment amount must be a ${allowZero ? 'non-negative' : 'positive'} finite number.`, 'PAYMENT_AMOUNT_INVALID', 422);
  }
  const scaled = value * 100;
  if (!Number.isInteger(scaled)) throw commercialError('Payment amount supports at most two decimal places.', 'PAYMENT_AMOUNT_PRECISION_INVALID', 422);
  return scaled;
};

class CommercialEvidenceIntegrityService {
  constructor({ clock = () => new Date(), futureToleranceMs = FUTURE_TOLERANCE_MS } = {}) {
    this.clock = clock;
    this.futureToleranceMs = futureToleranceMs;
  }

  validate(evidence, expected, actor) {
    if (!evidence || typeof evidence !== 'object') {
      throw commercialError('Attributable evidence is required.', 'COMMERCIAL_EVIDENCE_REQUIRED', 422);
    }
    const sourceType = normalizedText(evidence.sourceType);
    const sourceReference = normalizedText(evidence.sourceReference);
    const evidenceUnitReference = normalizedText(evidence.evidenceUnitReference || '');
    const checksum = normalizedText(evidence.checksum);
    if (!sourceType || !sourceReference) throw commercialError('Evidence source identity is required.', 'COMMERCIAL_EVIDENCE_SOURCE_REQUIRED', 422);
    if (sourceType.length > 80 || sourceReference.length > 240 || evidenceUnitReference.length > 160) throw commercialError('Evidence source identity exceeds safe bounds.', 'COMMERCIAL_EVIDENCE_SOURCE_INVALID', 422);
    if (!CHECKSUM.test(checksum)) throw commercialError('Evidence checksum must be a SHA-256 hex digest.', 'EVIDENCE_CHECKSUM_INVALID', 422);
    const timestampMs = Date.parse(evidence.evidenceTimestamp);
    if (!Number.isFinite(timestampMs) || timestampMs > this.clock().getTime() + this.futureToleranceMs) {
      throw commercialError('Evidence timestamp is invalid.', 'EVIDENCE_TIMESTAMP_INVALID', 422);
    }

    for (const field of BINDING_FIELDS) {
      if (expected[field] == null) continue;
      if (evidence[field] == null || !sameBinding(field, evidence[field], expected[field])) {
        throw commercialError(`Evidence ${field} does not match the asserted subject.`, 'COMMERCIAL_EVIDENCE_BINDING_MISMATCH', 409, { field });
      }
    }

    const identity = { checksum, evidenceUnitReference, sourceReference, sourceType };
    const evidenceFingerprint = createHash('sha256').update(canonicalJson(identity)).digest('hex');
    return {
      evidenceId: evidence.evidenceId || `evidence-${evidenceFingerprint.slice(0, 20)}`,
      evidenceFingerprint,
      sourceType,
      sourceReference,
      ...(evidenceUnitReference ? { evidenceUnitReference } : {}),
      ...expected,
      evidenceTimestamp: new Date(timestampMs).toISOString(),
      recordedAt: this.clock().toISOString(),
      checksum,
      verificationStatus: evidence.verificationStatus || 'evidence_confirmed',
      actor,
    };
  }

  static assertionsMatch(left, right) {
    return BINDING_FIELDS.every((field) => same(left[field], right[field]));
  }
}

module.exports = { BINDING_FIELDS, CommercialEvidenceIntegrityService, moneyToMinor };
