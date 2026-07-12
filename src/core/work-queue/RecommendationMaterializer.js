const crypto = require('crypto');

const safeKeyPart = (value) => String(value || 'unknown')
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, '_')
  .slice(0, 120);

const sourceFlowFor = (action = {}) => {
  if (action.id?.includes('quote_follow_up')) return 'quote_follow_up_flow';
  if (action.id?.includes('payment')) return 'manual_payment_review_flow';
  if (action.id?.includes('b2b')) return 'b2b_lead_flow';
  if (action.id?.includes('fulfillment')) return 'fulfillment_review_flow';
  if (action.id?.includes('catalog') || action.id?.includes('product')) return 'product_quality_flow';
  return action.type || 'founder_review';
};

const buildIdempotencyKey = (action = {}) => {
  const raw = `${sourceFlowFor(action)}:${action.type || 'internal_task'}:${action.id || action.title}`;
  const suffix = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  return `${safeKeyPart(raw)}:${suffix}`;
};

const materializeRecommendations = (actionState = {}, { operatingStage } = {}) => (
  (actionState.recommendedActions || []).map((action) => {
    const isDraft = /draft|quote|message|intro/i.test(action.type || '');
    return {
      idempotencyKey: buildIdempotencyKey(action),
      sourceType: 'action_engine',
      sourceId: action.id || null,
      sourceFlow: sourceFlowFor(action),
      actionType: action.type || 'internal_task',
      title: action.title,
      description: action.description,
      priority: action.priority || (/payment|launch/i.test(action.type || '') ? 'high' : 'medium'),
      status: isDraft ? 'drafted' : 'recommended',
      operatingStage: operatingStage || null,
      ownerType: 'founder',
      ownerId: 'founder',
      approvalRequired: action.approvalRequired !== false,
      evidence: {
        conditionActive: true,
        sourceMode: actionState.sourceMode || 'unknown',
        sourceActionId: action.id || null,
        dataSource: actionState.dataSource || null,
        generatedAt: actionState.generatedAt || null,
        writesBlocked: true,
        externalSendsBlocked: true,
      },
      safePayload: isDraft ? {
        draftType: action.type,
        content: action.description,
        sendStatus: 'not_sent',
        externalSendAllowed: false,
      } : {},
    };
  })
);

module.exports = { buildIdempotencyKey, materializeRecommendations, sourceFlowFor };
