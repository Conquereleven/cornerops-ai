const { sanitizeValue } = require('../security/SecuritySanitizer');
const { IntelligenceService } = require('./IntelligenceService');

const FLOW_LABELS = {
  b2b_lead_flow: 'B2B lead follow-up',
  quote_follow_up_flow: 'Quote follow-up',
  order_attention_flow: 'Order attention',
  manual_payment_review_flow: 'Manual payment review',
  product_quality_flow: 'Product quality',
  customer_follow_up_flow: 'Customer follow-up',
  fulfillment_review_flow: 'Fulfillment review',
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const unique = (items) => [...new Set(items.filter(Boolean))];

const matching = (items, terms) => asArray(items).filter((item) => {
  const text = JSON.stringify(item).toLowerCase();
  return terms.some((term) => text.includes(term));
});

const operationalRowCount = (counts = {}) => [
  counts.productsCount,
  counts.b2bLeadCount,
  counts.quoteCount,
  counts.orderCount,
  counts.customerCount,
  counts.paymentCount,
  counts.fulfillmentCount,
].reduce((sum, value) => sum + Number(value || 0), 0);

class FounderReviewService {
  constructor({
    auditLogService,
    connector,
    flowEngine,
    intelligenceService,
  } = {}) {
    this.auditLogService = auditLogService;
    this.intelligenceService = intelligenceService || new IntelligenceService({
      auditLogService,
      connector,
      flowEngine,
    });
  }

  async buildFounderReview(options = {}) {
    const requestId = options.requestId || 'founder-review-v1.6';
    const state = await this.intelligenceService.buildState({ requestId });
    const overview = state.overview || {};
    const counts = overview.counts || {};
    const anomalies = asArray(state.anomalies);
    const cases = asArray(state.cases);
    const signals = asArray(state.signals);
    const flowAnalysis = state.flowAnalysis || {};
    const flowSummary = flowAnalysis.summary || {};
    const hasConfirmedOperationalRows = operationalRowCount(counts) > 0;
    const reviewAnomalies = hasConfirmedOperationalRows ? anomalies : [];
    const reviewCases = hasConfirmedOperationalRows ? cases : [];
    const reviewSignals = hasConfirmedOperationalRows ? signals : [];
    const missingData = this.buildMissingDataChecklist({ counts, overview, flowSummary });
    const dataQuality = this.buildDataQuality({ overview, counts, flowSummary, missingData });
    const urgentActions = this.buildUrgentActions({ overview, anomalies: reviewAnomalies, missingData });
    const recommendedActions = this.buildRecommendedActions({
      overview,
      counts,
      hasConfirmedOperationalRows,
      missingData,
    });
    const review = {
      status: 'success',
      generatedAt: new Date().toISOString(),
      sourceMode: overview.sourceMode || 'mock',
      dataSource: overview.dataSource || 'unknown',
      safetyPosture: {
        readOnly: true,
        dryRun: true,
        writesBlocked: true,
        externalSendsBlocked: true,
        runtimeSupabaseWritesBlocked: true,
        whatsappSendsBlocked: true,
        emailSendsBlocked: true,
        customerChannelsDisabled: true,
        piiMasked: overview.piiMasked !== false,
      },
      dataQuality,
      executiveSummary: this.buildExecutiveSummary({ overview, counts, anomalies: reviewAnomalies, missingData }),
      urgentActions,
      operationalMetrics: {
        products: counts.productsCount || 0,
        b2bLeads: counts.b2bLeadCount || 0,
        quotes: counts.quoteCount || 0,
        orders: counts.orderCount || 0,
        customers: counts.customerCount || 0,
        payments: counts.paymentCount || 0,
        fulfillment: counts.fulfillmentCount || 0,
        anomalyCandidates: reviewAnomalies.length,
        openDraftCases: reviewCases.length,
      },
      inventoryRisks: matching(reviewAnomalies, ['inventory', 'stock', 'product']).slice(0, 8),
      paymentRisks: matching(reviewAnomalies, ['payment', 'bank transfer', 'manual_payment']).slice(0, 8),
      fulfillmentRisks: matching(reviewAnomalies, ['fulfillment', 'delivery', 'order_attention']).slice(0, 8),
      leadFollowUps: matching(reviewSignals, ['b2b_lead_flow', 'lead']).slice(0, 8),
      anomalyCandidates: reviewAnomalies.slice(0, 12),
      caseDrafts: reviewCases.slice(0, 12),
      recommendedActions,
      missingData,
      nextFounderStep: this.nextFounderStep({ sourceMode: overview.sourceMode, missingData, urgentActions }),
      auditId: overview.auditId,
      warnings: unique([
        ...(overview.warnings || []),
        ...(flowAnalysis.warnings || []),
        'Founder Review Loop v1.6 is read-only; recommended actions are review guidance only.',
      ]),
    };
    const audit = await this.auditLogService?.record?.({
      requestId,
      eventType: 'founder_review_read',
      dataSource: review.dataSource,
      operation: 'build_founder_review',
      userId: options.userId || 'founder-review-api',
      channel: options.channel || 'api',
      policyDecision: 'allowed_read_only',
      status: 'success',
      input: {
        sourceMode: review.sourceMode,
        urgentActionCount: urgentActions.length,
        missingDataCount: missingData.length,
        writesBlocked: true,
      },
    });
    return sanitizeValue({
      ...review,
      auditId: audit?.id || review.auditId,
    });
  }

  buildDataQuality({ overview, counts, flowSummary, missingData }) {
    const tableAvailability = overview.dataFreshness?.tableAvailability || {};
    const availableTables = Object.entries(tableAvailability)
      .filter(([, value]) => String(value).includes('available'))
      .map(([key]) => key);
    const hasOperationalRows = [
      counts.productsCount,
      counts.b2bLeadCount,
      counts.quoteCount,
      counts.orderCount,
      counts.customerCount,
      counts.paymentCount,
      counts.fulfillmentCount,
    ].some((value) => Number(value) > 0);
    const status = overview.sourceMode === 'real_read_only' && hasOperationalRows
      ? missingData.length ? 'usable_with_gaps' : 'usable'
      : hasOperationalRows ? 'partial' : 'missing_or_mock';
    return {
      status,
      sourceMode: overview.sourceMode || 'mock',
      dataSource: overview.dataSource || 'unknown',
      piiMasked: overview.piiMasked !== false,
      availableTables,
      tableAvailability,
      flowsWithData: flowSummary.flowsWithData || [],
      flowsMissingData: flowSummary.flowsMissingData || [],
      missingDataCount: missingData.length,
      warnings: overview.warnings || [],
    };
  }

  buildExecutiveSummary({ overview, counts, anomalies, missingData }) {
    const source = overview.sourceMode || 'mock';
    const totalRows = [
      counts.productsCount,
      counts.b2bLeadCount,
      counts.quoteCount,
      counts.orderCount,
      counts.customerCount,
      counts.paymentCount,
      counts.fulfillmentCount,
    ].reduce((sum, value) => sum + Number(value || 0), 0);
    if (!totalRows) {
      return `Founder review generated in ${source} mode with no confirmed operational rows; complete the missing data checklist before treating it as live operating truth.`;
    }
    return `Founder review generated in ${source} mode from ${totalRows} read-only operational row(s), with ${anomalies.length} anomaly candidate(s) and ${missingData.length} data gap(s).`;
  }

  buildUrgentActions({ overview, anomalies, missingData }) {
    const alerts = anomalies.length ? asArray(overview.topOperationalAlerts).slice(0, 5).map((alert) => ({
      id: alert.id,
      title: alert.title,
      severity: alert.severity || 'low',
      recommendedAction: alert.recommendedAction,
      approvalRequired: true,
      writesBlocked: true,
    })) : [];
    const highSignal = matching(anomalies, ['payment', 'fulfillment', 'delayed']).slice(0, 5).map((anomaly) => ({
      id: anomaly.id,
      title: anomaly.title,
      severity: anomaly.severity || 'medium',
      recommendedAction: anomaly.suggestedAction,
      approvalRequired: true,
      writesBlocked: true,
    }));
    const dataGapAction = missingData.length ? [{
      id: 'missing-data-checklist',
      title: 'Complete missing operational data checklist',
      severity: 'medium',
      recommendedAction: 'Import or map the missing read-only operational datasets before using review output for decisions.',
      approvalRequired: false,
      writesBlocked: true,
    }] : [];
    return [...alerts, ...highSignal, ...dataGapAction].slice(0, 8);
  }

  buildRecommendedActions({ overview, counts, hasConfirmedOperationalRows, missingData }) {
    const liveActions = hasConfirmedOperationalRows ? [
      ...(overview.recommendedFounderActions || []),
      counts.pendingPaymentReviewCount ? 'Review manual payment candidates; never mark paid automatically.' : null,
      counts.fulfillmentDelayedCount ? 'Review fulfillment delay candidates and prepare internal task drafts.' : null,
      counts.quoteFollowUpCount ? 'Review quote follow-up candidates and prepare non-sendable drafts.' : null,
      counts.warmLeads ? 'Review warm B2B lead follow-ups and prepare local drafts only.' : null,
    ] : [];
    return unique([
      ...liveActions,
      missingData.length ? 'Close the missing-data checklist for a stronger daily founder loop.' : null,
      'Keep all recommended actions approval-gated and read-only in v1.6.',
    ]).slice(0, 10);
  }

  buildMissingDataChecklist({ counts, overview, flowSummary }) {
    const tableAvailability = overview.dataFreshness?.tableAvailability || {};
    const missing = [];
    const add = (id, label, reason) => missing.push({ id, label, reason, requiredForFounderLoop: true });
    if (!counts.productsCount) add('products', 'Products', 'Needed for inventory risks and product quality review.');
    if (!counts.b2bLeadCount) add('b2b_leads', 'B2B leads', 'Needed for lead follow-up recommendations.');
    if (!counts.quoteCount) add('quotes', 'Quotes', 'Needed for quote follow-up recommendations.');
    if (!counts.orderCount) add('orders', 'Orders', 'Needed for order attention and fulfillment review.');
    if (!counts.customerCount) add('customers', 'Customers', 'Needed for customer follow-up context; PII must remain masked.');
    if (!counts.paymentCount) add('payments', 'Payments', 'Needed for manual payment review signals.');
    if (!counts.fulfillmentCount) add('fulfillment', 'Fulfillment', 'Needed for delivery delay detection.');
    Object.entries(tableAvailability).forEach(([table, status]) => {
      if (String(status).includes('missing')) add(`table_${table}`, table, `Read model table status is ${status}.`);
    });
    asArray(flowSummary.flowsMissingData).forEach((flowId) => {
      add(`flow_${flowId}`, FLOW_LABELS[flowId] || flowId, 'Flow has no usable candidate records.');
    });
    return unique(missing.map((item) => JSON.stringify(item))).map((item) => JSON.parse(item));
  }

  nextFounderStep({ sourceMode, missingData, urgentActions }) {
    if (sourceMode !== 'real_read_only') {
      return 'Confirm Supabase read-only credentials and public read model before treating the review as live.';
    }
    if (missingData.length) {
      return 'Import or map the missing operational datasets, then rerun npm run founder:review.';
    }
    if (urgentActions.length) {
      return 'Review urgent actions manually and create approval-gated internal cases where needed.';
    }
    return 'Use this review as the daily founder operating checklist; keep writes and sends disabled.';
  }
}

module.exports = { FounderReviewService };
