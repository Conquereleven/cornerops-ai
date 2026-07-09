const { convertAnomalyToCaseDraft, normalizeConfidenceScore, normalizeSeverity, stableKey } = require('../../intelligence');

const normalizeStatus = (status) => {
  const value = String(status || '').toLowerCase();
  if (['dismissed', 'resolved', 'investigating', 'open'].includes(value)) return value;
  return 'suggested_signal';
};

const mapCornerMexAnomalyToCornerOpsAnomaly = (event = {}) => {
  const anomalyKey = event.anomaly_key || event.anomalyKey || stableKey(event.type, event.product_id, event.emirate_code, event.first_detected_at);
  const anomaly = {
    id: `anomaly-cornermex-${stableKey(anomalyKey)}`,
    anomalyKey,
    clientSlug: 'cornermex',
    type: event.type || 'unknown',
    severity: normalizeSeverity(event.severity),
    status: normalizeStatus(event.status),
    title: event.title || `CornerMex anomaly ${anomalyKey}`,
    description: event.description || '',
    evidence: event.evidence || [],
    hypotheses: event.hypotheses || [],
    suggestedAction: event.suggested_action || event.suggestedAction || 'Review anomaly evidence before any action.',
    emirate: {
      code: event.emirate_code || null,
      name: event.emirate_name || null,
    },
    product: {
      id: event.product_id || null,
      slug: event.product_slug || null,
    },
    confidenceScore: normalizeConfidenceScore(event.confidence_score ?? event.confidenceScore),
    firstDetectedAt: event.first_detected_at || null,
    lastDetectedAt: event.last_detected_at || null,
    source: event.source || 'cornermex_live_view',
    sourceMode: 'contract_only',
    readOnly: true,
    writesBlocked: true,
    externalSendsBlocked: true,
  };
  return {
    ...anomaly,
    caseDraft: convertAnomalyToCaseDraft(anomaly),
  };
};

const createCornerMexAnomalyEventContract = ({
  sourceMode = 'contract_only',
  sourceReference = 'future public anomaly_events read model',
} = {}) => ({
  entity: 'CornerMexAnomalyEvent',
  source: 'cornermex_live_view',
  sourceMode,
  sourceReference,
  canonicalTarget: 'CornerOps Anomaly',
  requiredFields: ['anomaly_key', 'type', 'severity', 'status', 'title', 'first_detected_at', 'source'],
  optionalFields: [
    'description',
    'evidence',
    'hypotheses',
    'suggested_action',
    'emirate_code',
    'emirate_name',
    'product_id',
    'product_slug',
    'confidence_score',
    'last_detected_at',
  ],
  piiClassification: 'low',
  confidence: sourceMode === 'real_read_only' ? 'high' : 'medium',
  missingFields: sourceMode === 'real_read_only' ? [] : ['live anomaly_events read-only view is not connected yet'],
  warnings: ['Contract only in v1.5; no live sync, database writes, or CornerMex mutations are enabled.'],
});

module.exports = {
  createCornerMexAnomalyEventContract,
  mapCornerMexAnomalyToCornerOpsAnomaly,
};
