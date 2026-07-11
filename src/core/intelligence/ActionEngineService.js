const { CAPABILITY_STATES } = require('./CapabilityMatrixService');

const FLOW_LABELS = Object.freeze({
  b2b_lead_flow: 'B2B Leads',
  quote_follow_up_flow: 'Quote Follow-Up',
  order_attention_flow: 'Orders Needing Attention',
  manual_payment_review_flow: 'Manual Payment Review',
  product_quality_flow: 'Product Quality',
  customer_follow_up_flow: 'Customer Follow-Up',
  fulfillment_review_flow: 'Fulfillment Review',
});

const NO_DATA_REASONS = Object.freeze({
  order_attention_flow: 'No orders requiring founder attention yet.',
  fulfillment_review_flow: 'No fulfillment or shipment records available yet.',
  customer_follow_up_flow: 'Pre-launch customer follow-up is disabled until customer history and consent exist.',
  b2b_lead_flow: 'No B2B lead records available for follow-up analysis.',
  quote_follow_up_flow: 'No quote records available for follow-up analysis.',
  manual_payment_review_flow: 'No manual payment candidates available yet.',
});

class ActionEngineService {
  constructor({
    auditLogService,
    catalogCohortService,
    flowEngine,
    founderReviewService,
  } = {}) {
    this.auditLogService = auditLogService;
    this.catalogCohortService = catalogCohortService;
    this.flowEngine = flowEngine;
    this.founderReviewService = founderReviewService;
  }

  async build({ requestId = 'action-engine-v1.8', userId = 'control-tower', channel = 'api' } = {}) {
    const context = { requestId, userId, channel };
    const [catalog, flowAnalysis, founderReview] = await Promise.all([
      this.catalogCohortService.buildCohort(context),
      this.flowEngine.analyzeFlows({ requestId, operatorId: userId }),
      this.founderReviewService?.buildFounderReview
        ? this.founderReviewService.buildFounderReview({ requestId: `${requestId}-founder-review`, userId, channel })
        : Promise.resolve(null),
    ]);
    const flows = this.buildFlows({ catalog, flowAnalysis });
    const recommendedActions = this.recommendedActions({ catalog, flows, founderReview });
    const audit = await this.auditLogService?.record?.({
      ...context,
      eventType: 'action_engine_v1_8',
      dataSource: catalog.dataSource,
      operation: 'build_recommended_actions',
      policyDecision: 'allowed_read_only',
      status: 'success',
      input: {
        flowCount: flows.length,
        recommendedActionCount: recommendedActions.length,
        writesBlocked: true,
      },
    });
    return {
      sourceMode: catalog.sourceMode || flowAnalysis.sourceMode || 'real_read_only',
      dataSource: catalog.dataSource || flowAnalysis.dataSource || 'cornermex_supabase',
      generatedAt: new Date().toISOString(),
      flows,
      recommendedActions,
      approvalQueue: [],
      auditId: audit?.id || `audit-action-engine-${Date.now()}`,
      safety: {
        productionWritesBlocked: true,
        externalSendsBlocked: true,
        customerChannelsDisabled: true,
        productActivationBlocked: true,
      },
      warnings: [
        ...(catalog.warnings || []),
        ...(flowAnalysis.warnings || []),
      ],
    };
  }

  async createDrafts(options = {}) {
    const actionState = await this.build(options);
    const drafts = actionState.recommendedActions.map((action, index) => ({
      id: `draft-action-v18-${index + 1}`,
      sourceActionId: action.id,
      type: action.type,
      title: action.title,
      body: action.description,
      status: 'drafted',
      sendStatus: 'not_sendable_in_current_version',
      persistence: 'not_configured',
      approvalRequired: action.approvalRequired !== false,
      externalSendBlocked: true,
      productionWriteBlocked: true,
    }));
    return {
      status: 'success',
      sourceMode: actionState.sourceMode,
      generatedAt: new Date().toISOString(),
      persistence: 'not_configured',
      drafts,
      safety: actionState.safety,
      warnings: ['Drafts are returned in response only; no external send or production write occurred.'],
      auditId: actionState.auditId,
    };
  }

  buildFlows({ catalog, flowAnalysis }) {
    const flowsById = Object.fromEntries((flowAnalysis.flows || []).map((flow) => [flow.id, flow]));
    return Object.keys(FLOW_LABELS).map((id) => {
      if (id === 'product_quality_flow') return this.productQualityFlow(catalog);
      const flow = flowsById[id] || { records: [] };
      const hasData = (flow.records || []).length > 0;
      const capabilityState = hasData
        ? (id === 'quote_follow_up_flow' ? CAPABILITY_STATES.APPROVAL_REQUIRED : CAPABILITY_STATES.INTERNAL_DRAFT_ENABLED)
        : CAPABILITY_STATES.NO_DATA_YET;
      return {
        id,
        label: FLOW_LABELS[id],
        status: hasData ? 'has_data' : 'no_data_yet',
        dataState: hasData ? 'has_data' : 'no_data_yet',
        capabilityState,
        triggers: (flow.records || []).slice(0, 10),
        nextActions: hasData
          ? (flow.records || []).slice(0, 5).map((record) => record.proposedTask || record.reason)
          : [],
        reason: hasData ? null : (NO_DATA_REASONS[id] || 'Waiting for required data.'),
        counts: { candidates: (flow.records || []).length },
        readOnly: true,
        writesBlocked: true,
        externalSendsBlocked: true,
      };
    });
  }

  productQualityFlow(catalog = {}) {
    const triggers = [
      catalog.missingImageCount === null
        ? { id: 'image_mapping_needed', reason: 'Image field is not exposed by the current read model.' }
        : catalog.missingImageCount > 0 ? { id: 'missing_images', reason: `Review ${catalog.missingImageCount} product(s) missing image.` } : null,
      catalog.duplicateSkuCount > 0 ? { id: 'duplicate_skus', reason: `${catalog.duplicateSkuCount} duplicate SKU group(s) detected.` } : null,
      catalog.importedCatalogReconciled ? null : { id: 'catalog_count_mismatch', reason: 'Imported draft product count does not match expected count.' },
      catalog.stock50ConfirmedForImported ? null : { id: 'stock_mismatch', reason: 'Imported product stock is not consistently 50.' },
    ].filter(Boolean);
    return {
      id: 'product_quality_flow',
      label: FLOW_LABELS.product_quality_flow,
      status: catalog.totalReadableProducts ? 'has_data' : 'no_data_yet',
      dataState: catalog.totalReadableProducts ? 'has_data' : 'no_data_yet',
      capabilityState: CAPABILITY_STATES.INTERNAL_DRAFT_ENABLED,
      triggers,
      nextActions: [
        catalog.missingImageCount === null ? 'Map image_url into the read-only product view for final image QA.' : null,
        catalog.missingImageCount > 0 ? `Review ${catalog.missingImageCount} product(s) missing image.` : null,
        'Validate 190 draft imported products.',
        'Select first launch-ready products.',
        'Review products ready for activation.',
      ].filter(Boolean),
      reason: catalog.totalReadableProducts ? null : 'Readable products are required for product quality analysis.',
      counts: {
        totalReadableProducts: catalog.totalReadableProducts || 0,
        importedIntermexDraftProducts: catalog.importedIntermexDraftProducts || 0,
        existingActiveProducts: catalog.existingActiveProducts || 0,
        productsWithPrice: catalog.productsWithPrice,
        productsWithImage: catalog.productsWithImage,
        productsWithStock50: catalog.productsWithStock50,
        missingImageCount: catalog.missingImageCount,
        duplicateSkuCount: catalog.duplicateSkuCount || 0,
      },
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
    };
  }

  recommendedActions({ catalog, flows, founderReview }) {
    const actions = [
      {
        id: 'catalog_validate_190_imported_drafts',
        type: 'catalog_review',
        status: 'recommended',
        title: 'Validate 190 imported Intermex draft products',
        description: `${catalog.importedIntermexDraftProducts || 0} imported draft products are readable and remain inactive.`,
        approvalRequired: false,
      },
      catalog.missingImageCount === null
        ? {
          id: 'catalog_map_image_field',
          type: 'catalog_review',
          status: 'recommended',
          title: 'Expose image_url in read-only product view',
          description: 'The current public product read model does not expose image fields, so image QA needs mapping before final launch review.',
          approvalRequired: true,
        }
        : catalog.missingImageCount > 0 ? {
          id: 'catalog_review_missing_images',
          type: 'catalog_review',
          status: 'recommended',
          title: `Review ${catalog.missingImageCount} product missing image`,
          description: 'Complete image QA before activating launch products.',
          approvalRequired: false,
        } : null,
      {
        id: 'launch_select_first_products',
        type: 'launch_readiness_task',
        status: 'recommended',
        title: 'Select first launch-ready products',
        description: 'Founder should choose the first safe launch batch before activation is enabled.',
        approvalRequired: false,
      },
      ...(founderReview?.launchActions || []).slice(0, 4).map((item, index) => ({
        id: `founder_review_action_${index + 1}`,
        type: 'founder_review',
        status: 'recommended',
        title: item.title || String(item),
        description: item.title || String(item),
        approvalRequired: false,
      })),
    ].filter(Boolean);

    for (const flow of flows) {
      if (flow.id === 'product_quality_flow' || flow.dataState !== 'has_data') continue;
      actions.push({
        id: `${flow.id}_internal_review`,
        type: flow.id.includes('quote') ? 'quote_follow_up_draft' : flow.id.includes('payment') ? 'payment_review' : 'internal_task',
        status: 'recommended',
        title: `${flow.label}: review ${flow.counts.candidates} candidate(s)`,
        description: flow.nextActions[0] || flow.reason || `Review ${flow.label}.`,
        approvalRequired: flow.capabilityState === CAPABILITY_STATES.APPROVAL_REQUIRED,
      });
    }

    return actions.slice(0, 20).map((action) => ({
      ...action,
      writesBlocked: true,
      externalSendsBlocked: true,
      customerChannelsDisabled: true,
    }));
  }
}

module.exports = {
  ActionEngineService,
  FLOW_LABELS,
  NO_DATA_REASONS,
};
