const { randomUUID } = require('crypto');
const {
  CONNECTOR_TYPES,
  INTELLIGENCE_CASE_STATUSES,
  INTELLIGENCE_SEVERITIES,
  INTELLIGENCE_SOURCE_MODES,
} = require('./intelligenceTypes');

const lower = (value) => String(value || '').toLowerCase();
const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const normalizeSeverity = (value) => {
  const text = lower(value);
  if (['critical', 'critico', 'p0'].includes(text)) return INTELLIGENCE_SEVERITIES.CRITICAL;
  if (['high', 'alto', 'p1'].includes(text)) return INTELLIGENCE_SEVERITIES.HIGH;
  if (['medium', 'medio', 'p2'].includes(text)) return INTELLIGENCE_SEVERITIES.MEDIUM;
  return INTELLIGENCE_SEVERITIES.LOW;
};

const normalizeConfidenceScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0.5;
  if (numeric > 1) return Math.max(0, Math.min(numeric / 100, 1));
  return Math.max(0, Math.min(numeric, 1));
};

const scoreAnomalyRuleBased = (anomaly = {}) => {
  const severity = normalizeSeverity(anomaly.severity);
  const confidence = normalizeConfidenceScore(anomaly.confidenceScore ?? anomaly.confidence_score);
  const severityWeight = {
    [INTELLIGENCE_SEVERITIES.CRITICAL]: 1,
    [INTELLIGENCE_SEVERITIES.HIGH]: 0.8,
    [INTELLIGENCE_SEVERITIES.MEDIUM]: 0.55,
    [INTELLIGENCE_SEVERITIES.LOW]: 0.3,
  }[severity];
  return Number(((severityWeight * 0.65) + (confidence * 0.35)).toFixed(2));
};

const generateHypothesisTemplates = (anomaly = {}) => {
  const type = lower(anomaly.type);
  if (type.includes('inventory') || type.includes('stock')) {
    return [
      'Stock signal may be stale or below reorder threshold.',
      'Product demand may be higher than recent replenishment cadence.',
    ];
  }
  if (type.includes('payment')) {
    return [
      'Manual payment evidence may require founder review.',
      'Payment status may not match fulfillment readiness.',
    ];
  }
  if (type.includes('fulfillment') || type.includes('delivery')) {
    return [
      'Fulfillment state may be delayed or missing tracking evidence.',
      'Carrier or internal handling state may need operator review.',
    ];
  }
  return [
    'Operational signal needs founder review before action.',
    'Available evidence is incomplete; avoid automated mutation.',
  ];
};

const recommendAction = (anomaly = {}) => {
  const severity = normalizeSeverity(anomaly.severity);
  const type = lower(anomaly.type);
  if (severity === INTELLIGENCE_SEVERITIES.CRITICAL) return 'Escalate to founder review immediately; keep all actions approval-gated.';
  if (type.includes('payment')) return 'Create a manual payment review case draft; never mark paid automatically.';
  if (type.includes('inventory') || type.includes('stock')) return 'Create product/inventory review case draft and verify source data.';
  if (type.includes('lead')) return 'Create B2B follow-up case draft and prepare a non-sendable message draft.';
  return 'Create an internal investigation case draft and collect more evidence.';
};

const stableKey = (...parts) => parts
  .filter((part) => part !== undefined && part !== null && String(part).trim())
  .map((part) => String(part).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
  .join(':');

const convertAnomalyToCaseDraft = (anomaly = {}) => {
  const anomalyKey = anomaly.anomalyKey || anomaly.anomaly_key || anomaly.id || randomUUID();
  const score = scoreAnomalyRuleBased(anomaly);
  return {
    id: `case-draft-${stableKey(anomaly.clientSlug || 'cornermex', anomalyKey)}`,
    anomalyKey,
    clientSlug: anomaly.clientSlug || 'cornermex',
    title: anomaly.title || `Review anomaly ${anomalyKey}`,
    status: INTELLIGENCE_CASE_STATUSES.DRAFT,
    severity: normalizeSeverity(anomaly.severity),
    confidenceScore: normalizeConfidenceScore(anomaly.confidenceScore ?? anomaly.confidence_score),
    ruleScore: score,
    recommendedAction: anomaly.suggestedAction || anomaly.suggested_action || recommendAction(anomaly),
    playbookId: `playbook-${stableKey(anomaly.type || 'general-review')}`,
    sourceMode: anomaly.sourceMode || INTELLIGENCE_SOURCE_MODES.LOCAL_INTERNAL,
    readOnly: true,
    writesBlocked: true,
    dryRun: true,
    externalSendsBlocked: true,
  };
};

const buildConnectors = (connectorStatus = {}) => ([
  {
    id: 'connector-cornermex',
    type: CONNECTOR_TYPES.CORNERMEX,
    name: 'CornerMex',
    status: connectorStatus.sourceMode || INTELLIGENCE_SOURCE_MODES.REPO_DISCOVERED,
    dataSource: connectorStatus.dataSource || 'cornermex_supabase',
    readOnly: true,
    writesBlocked: true,
  },
  {
    id: 'connector-manual-import',
    type: CONNECTOR_TYPES.MANUAL_IMPORT,
    name: 'Manual CSV/Admin Import',
    status: 'prepared',
    dataSource: 'manual_admin_review',
    readOnly: true,
    writesBlocked: true,
  },
]);

const buildPlaybooks = () => ([
  {
    id: 'playbook-payment-review',
    name: 'Manual Payment Review',
    anomalyTypes: ['payment_review', 'bank_transfer_pending'],
    steps: ['Verify evidence manually', 'Prepare internal note', 'Require approval before status changes'],
    writesBlocked: true,
  },
  {
    id: 'playbook-inventory-quality',
    name: 'Inventory/Product Quality Review',
    anomalyTypes: ['inventory_low_stock', 'product_data_missing'],
    steps: ['Check product fields', 'Create internal task draft', 'Avoid automatic product edits'],
    writesBlocked: true,
  },
  {
    id: 'playbook-fulfillment-review',
    name: 'Fulfillment Review',
    anomalyTypes: ['fulfillment_delayed', 'tracking_missing'],
    steps: ['Review order evidence', 'Create case draft', 'Escalate delayed orders to founder'],
    writesBlocked: true,
  },
]);

const buildSignalsFromFlows = (flowAnalysis = {}) => asArray(flowAnalysis.flows).flatMap((flow) =>
  asArray(flow.records).map((record) => ({
    id: `signal-${stableKey(flow.id, record.id)}`,
    clientSlug: 'cornermex',
    type: flow.id,
    title: record.reason,
    source: 'cornermex_flow_engine',
    sourceMode: flow.sourceMode || flowAnalysis.sourceMode || INTELLIGENCE_SOURCE_MODES.REPO_DISCOVERED,
    entityId: record.id,
    readOnly: true,
  })));

const buildAnomaliesFromFlows = (flowAnalysis = {}) => buildSignalsFromFlows(flowAnalysis).map((signal) => ({
  id: `anomaly-${signal.id.replace(/^signal-/, '')}`,
  anomalyKey: signal.id.replace(/^signal-/, ''),
  clientSlug: signal.clientSlug,
  type: signal.type,
  severity: signal.type.includes('payment') || signal.type.includes('order') ? 'medium' : 'low',
  status: 'suggested_signal',
  title: signal.title,
  description: 'Rule-based suggested signal from read-only CornerMex operational flow analysis.',
  evidence: [{ source: signal.source, entityId: signal.entityId }],
  hypotheses: generateHypothesisTemplates(signal),
  suggestedAction: recommendAction(signal),
  confidenceScore: 0.55,
  sourceMode: signal.sourceMode,
  readOnly: true,
  writesBlocked: true,
}));

const summarizeCounts = (connectorStatus = {}, flowAnalysis = {}, anomalies = []) => ({
  productsCount: Number(connectorStatus.rowCounts?.products || 0),
  activeProducts: Number(connectorStatus.rowCounts?.products || 0),
  lowStockProducts: flowAnalysis.summary?.candidates?.product_quality_flow || 0,
  b2bLeadCount: Number(connectorStatus.rowCounts?.leads || 0),
  warmLeads: flowAnalysis.summary?.candidates?.b2b_lead_flow || 0,
  pendingPaymentReviewCount: flowAnalysis.summary?.candidates?.manual_payment_review_flow || 0,
  fulfillmentDelayedCount: flowAnalysis.summary?.candidates?.fulfillment_review_flow || 0,
  anomalyCandidateCount: anomalies.length,
  trackedAnomalyCaseCount: 0,
});

const buildIntelligenceOverview = ({
  connectorStatus = {},
  flowAnalysis = {},
  clients = [],
  signals = [],
  anomalies = [],
  cases = [],
  playbooks = buildPlaybooks(),
  connectors = buildConnectors(connectorStatus),
} = {}) => {
  const counts = summarizeCounts(connectorStatus, flowAnalysis, anomalies);
  return {
    status: 'success',
    sourceMode: connectorStatus.sourceMode || flowAnalysis.sourceMode || INTELLIGENCE_SOURCE_MODES.REPO_DISCOVERED,
    dataSource: connectorStatus.dataSource || flowAnalysis.dataSource || 'cornermex_supabase',
    readOnly: true,
    dryRun: true,
    writesBlocked: true,
    externalSendsBlocked: true,
    piiMasked: connectorStatus.maskingApplied !== false,
    generatedAt: new Date().toISOString(),
    clients,
    counts,
    topOperationalAlerts: anomalies.slice(0, 5).map((anomaly) => ({
      id: anomaly.id,
      title: anomaly.title,
      severity: normalizeSeverity(anomaly.severity),
      recommendedAction: anomaly.suggestedAction || recommendAction(anomaly),
    })),
    recommendedFounderActions: [
      counts.pendingPaymentReviewCount ? 'Review pending manual payment candidates.' : null,
      counts.lowStockProducts ? 'Review product quality or inventory gaps.' : null,
      counts.b2bLeadCount === 0 ? 'Onboard B2B lead records through the manual data template.' : null,
      'Keep writes and external sends blocked until an approval-gated action sprint.',
    ].filter(Boolean),
    dataFreshness: {
      lastReadAt: connectorStatus.lastReadAt || flowAnalysis.lastReadAt || null,
      tableAvailability: connectorStatus.tableAvailability || flowAnalysis.tableAvailability || {},
    },
    signals,
    anomalies,
    cases,
    playbooks,
    connectors,
    warnings: [...new Set([
      ...(connectorStatus.warnings || []),
      ...(flowAnalysis.warnings || []),
      'Anomaly case ingestion is contract-only in v1.5; no live CornerMex anomaly_events sync is enabled.',
    ])],
  };
};

module.exports = {
  buildConnectors,
  buildIntelligenceOverview,
  buildPlaybooks,
  buildSignalsFromFlows,
  buildAnomaliesFromFlows,
  convertAnomalyToCaseDraft,
  generateHypothesisTemplates,
  normalizeConfidenceScore,
  normalizeSeverity,
  recommendAction,
  scoreAnomalyRuleBased,
  stableKey,
};
