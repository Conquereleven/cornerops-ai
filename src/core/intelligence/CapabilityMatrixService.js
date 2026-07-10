const CAPABILITY_STATES = Object.freeze({
  APPROVAL_REQUIRED: 'approval_required',
  BLOCKED_BY_SAFETY: 'blocked_by_safety',
  INTERNAL_DRAFT_ENABLED: 'internal_draft_enabled',
  LIVE_READ_ONLY: 'live_read_only',
  NEEDS_CONFIGURATION: 'not_configured',
  NO_DATA_YET: 'no_data_yet',
});

const labelFor = (state) => ({
  [CAPABILITY_STATES.APPROVAL_REQUIRED]: 'Approval required',
  [CAPABILITY_STATES.BLOCKED_BY_SAFETY]: 'Blocked by safety',
  [CAPABILITY_STATES.INTERNAL_DRAFT_ENABLED]: 'Internal draft enabled',
  [CAPABILITY_STATES.LIVE_READ_ONLY]: 'Live read-only',
  [CAPABILITY_STATES.NEEDS_CONFIGURATION]: 'Needs configuration',
  [CAPABILITY_STATES.NO_DATA_YET]: 'No data yet',
}[state] || state);

class CapabilityMatrixService {
  build({ actionEngine = {}, connectors = {} } = {}) {
    const flowStates = Object.fromEntries((actionEngine.flows || []).map((flow) => [flow.id, {
      id: flow.id,
      label: flow.label,
      state: flow.capabilityState,
      stateLabel: labelFor(flow.capabilityState),
      dataState: flow.dataState,
      reason: flow.reason,
    }]));

    const capabilities = [
      ['read_only_intelligence', 'Read-only intelligence', CAPABILITY_STATES.LIVE_READ_ONLY, 'CornerOps can analyze live safe reads.'],
      ['catalog_analysis', 'Catalog analysis', CAPABILITY_STATES.LIVE_READ_ONLY, 'Catalog cohort reads are available without mutations.'],
      ['founder_review', 'Founder Review', CAPABILITY_STATES.LIVE_READ_ONLY, 'Founder Review runs in pre-launch read-only mode.'],
      ['product_quality_flow', 'Product quality flow', flowStates.product_quality_flow?.state || CAPABILITY_STATES.INTERNAL_DRAFT_ENABLED, flowStates.product_quality_flow?.reason],
      ['b2b_lead_flow', 'B2B lead flow', flowStates.b2b_lead_flow?.state || CAPABILITY_STATES.NO_DATA_YET, flowStates.b2b_lead_flow?.reason],
      ['quote_follow_up_flow', 'Quote follow-up flow', flowStates.quote_follow_up_flow?.state || CAPABILITY_STATES.APPROVAL_REQUIRED, flowStates.quote_follow_up_flow?.reason],
      ['manual_payment_review_flow', 'Manual payment review flow', flowStates.manual_payment_review_flow?.state || CAPABILITY_STATES.INTERNAL_DRAFT_ENABLED, flowStates.manual_payment_review_flow?.reason],
      ['order_attention_flow', 'Order attention flow', flowStates.order_attention_flow?.state || CAPABILITY_STATES.NO_DATA_YET, flowStates.order_attention_flow?.reason],
      ['fulfillment_review_flow', 'Fulfillment review flow', flowStates.fulfillment_review_flow?.state || CAPABILITY_STATES.NO_DATA_YET, flowStates.fulfillment_review_flow?.reason],
      ['customer_follow_up_flow', 'Customer follow-up flow', flowStates.customer_follow_up_flow?.state || CAPABILITY_STATES.NO_DATA_YET, flowStates.customer_follow_up_flow?.reason],
      ['internal_tasks', 'Internal tasks', CAPABILITY_STATES.INTERNAL_DRAFT_ENABLED, 'Safe internal task drafts can be generated.'],
      ['draft_generation', 'Draft generation', CAPABILITY_STATES.APPROVAL_REQUIRED, 'Drafts are internal and require review before any send path exists.'],
      ['approval_queue', 'Approval queue', CAPABILITY_STATES.LIVE_READ_ONLY, 'Approvals are visible without execution.'],
      ['audit_log', 'Audit log', CAPABILITY_STATES.LIVE_READ_ONLY, 'Sanitized audit visibility is available.'],
      ['telegram', 'Telegram founder channel', connectors.telegram?.status === 'active'
        ? CAPABILITY_STATES.LIVE_READ_ONLY
        : CAPABILITY_STATES.NEEDS_CONFIGURATION, connectors.telegram?.reason || 'Telegram is founder-only and allowlisted when configured.'],
      ['supabase_read_only', 'Supabase read-only', connectors.cornermexSupabase?.status === 'connected'
        ? CAPABILITY_STATES.LIVE_READ_ONLY
        : CAPABILITY_STATES.NEEDS_CONFIGURATION, connectors.cornermexSupabase?.reason || 'Supabase reads remain non-mutating.'],
      ['github_write', 'GitHub write', CAPABILITY_STATES.APPROVAL_REQUIRED, 'GitHub writes must go through PR/review flows.'],
      ['lovable_mutation', 'Lovable mutation', CAPABILITY_STATES.APPROVAL_REQUIRED, 'Lovable changes require manual review.'],
      ['openclaw', 'OpenClaw', CAPABILITY_STATES.NEEDS_CONFIGURATION, 'OpenClaw execution is not active in v1.8.'],
      ['whatsapp_send', 'WhatsApp send', CAPABILITY_STATES.BLOCKED_BY_SAFETY, 'Blocked during pre-launch.'],
      ['email_send', 'Email send', CAPABILITY_STATES.APPROVAL_REQUIRED, 'Email send path remains disabled; drafts only.'],
      ['customer_channels', 'Customer channels', CAPABILITY_STATES.BLOCKED_BY_SAFETY, 'Customer channels stay disabled pre-launch.'],
      ['supabase_production_write', 'Supabase production write', CAPABILITY_STATES.BLOCKED_BY_SAFETY, 'Production writes are blocked by policy.'],
    ].map(([id, label, state, reason]) => ({
      id,
      label,
      state,
      stateLabel: labelFor(state),
      reason: reason || null,
      failure: false,
    }));

    return {
      states: CAPABILITY_STATES,
      capabilities,
      summary: {
        liveReadOnly: capabilities.filter((item) => item.state === CAPABILITY_STATES.LIVE_READ_ONLY).map((item) => item.id),
        internalDraftEnabled: capabilities.filter((item) => item.state === CAPABILITY_STATES.INTERNAL_DRAFT_ENABLED).map((item) => item.id),
        approvalRequired: capabilities.filter((item) => item.state === CAPABILITY_STATES.APPROVAL_REQUIRED).map((item) => item.id),
        blockedBySafety: capabilities.filter((item) => item.state === CAPABILITY_STATES.BLOCKED_BY_SAFETY).map((item) => item.id),
        notConfigured: capabilities.filter((item) => item.state === CAPABILITY_STATES.NEEDS_CONFIGURATION).map((item) => item.id),
        noDataYet: capabilities.filter((item) => item.state === CAPABILITY_STATES.NO_DATA_YET).map((item) => item.id),
      },
    };
  }
}

module.exports = {
  CAPABILITY_STATES,
  CapabilityMatrixService,
  labelFor,
};
