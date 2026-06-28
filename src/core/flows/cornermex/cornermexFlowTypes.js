const CORNERMEX_FLOW_IDS = Object.freeze({
  B2B_LEAD: 'b2b_lead_flow',
  QUOTE_FOLLOW_UP: 'quote_follow_up_flow',
  ORDER_ATTENTION: 'order_attention_flow',
  MANUAL_PAYMENT_REVIEW: 'manual_payment_review_flow',
  PRODUCT_QUALITY: 'product_quality_flow',
  CUSTOMER_FOLLOW_UP: 'customer_follow_up_flow',
  FULFILLMENT_REVIEW: 'fulfillment_review_flow',
});

const CORNERMEX_FLOW_SOURCE_MODES = Object.freeze([
  'mock',
  'repo_discovered',
  'real_read_only',
  'mixed',
  'local_internal',
  'dry_run',
  'disabled',
]);

module.exports = {
  CORNERMEX_FLOW_IDS,
  CORNERMEX_FLOW_SOURCE_MODES,
};
