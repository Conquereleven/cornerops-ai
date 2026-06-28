const { randomUUID } = require('crypto');
const { sanitizeMessage } = require('../security/SecuritySanitizer');
const { MessageDraftPolicy } = require('./MessageDraftPolicy');
const { MESSAGE_DRAFT_SEND_STATUS, MESSAGE_DRAFT_TYPES } = require('./messageDraftTypes');

const typeForChannel = (channel, text = '') => {
  const lower = String(`${channel} ${text}`).toLowerCase();
  if (lower.includes('payment')) return MESSAGE_DRAFT_TYPES.PAYMENT_REVIEW;
  if (lower.includes('quote')) return MESSAGE_DRAFT_TYPES.QUOTE_FOLLOW_UP;
  if (lower.includes('email')) return MESSAGE_DRAFT_TYPES.EMAIL_FOLLOW_UP;
  if (lower.includes('whatsapp')) return MESSAGE_DRAFT_TYPES.WHATSAPP_FOLLOW_UP;
  return MESSAGE_DRAFT_TYPES.B2B_LEAD_INTRO;
};

class CornerMexMessageDraftService {
  constructor({ auditLogService, policy = new MessageDraftPolicy() } = {}) {
    this.auditLogService = auditLogService;
    this.policy = policy;
  }

  async createDraft({
    channel = 'internal',
    text = '',
    sourceMode = 'local_internal',
    requestId = `message-draft-${randomUUID().slice(0, 12)}`,
    operatorId = 'local-founder',
    relatedEntityId,
  } = {}) {
    const decision = this.policy.evaluate();
    if (!decision.allowed) {
      return {
        status: 'denied',
        sourceMode,
        sendStatus: MESSAGE_DRAFT_SEND_STATUS.NOT_SENDABLE,
        warnings: decision.warnings,
      };
    }
    const draft = {
      id: `draft-${randomUUID().slice(0, 12)}`,
      type: typeForChannel(channel, text),
      channel: channel.includes('email') ? 'email' : channel.includes('whatsapp') ? 'whatsapp' : 'internal',
      body: sanitizeMessage(this.composeDraft(text)),
      relatedEntityId: relatedEntityId ? sanitizeMessage(String(relatedEntityId)) : undefined,
      sourceMode,
      dryRun: true,
      localOnly: true,
      sendStatus: MESSAGE_DRAFT_SEND_STATUS.NOT_SENDABLE,
      createdAt: new Date().toISOString(),
    };
    const audit = await this.auditLogService?.record?.({
      requestId,
      eventType: 'cornermex_message_draft_created',
      dataSource: 'operator_interface',
      operation: draft.type,
      userId: operatorId,
      channel: 'internal',
      policyDecision: 'allowed',
      status: 'dry_run',
      input: {
        draftId: draft.id,
        type: draft.type,
        sendStatus: draft.sendStatus,
        localOnly: true,
      },
    });
    return {
      status: 'dry_run',
      draft,
      sourceMode,
      auditId: audit?.id,
      warnings: ['Draft is local/internal only. WhatsApp and email sending are disabled in v1.2.'],
    };
  }

  composeDraft(text) {
    const request = sanitizeMessage(text || 'follow-up');
    return [
      'Hola, gracias por tu interés en CornerMex.',
      `Borrador interno basado en: ${request}`,
      'Antes de enviar, confirma disponibilidad, precio, tiempos y datos del cliente en CornerOps.',
    ].join('\n');
  }
}

module.exports = { CornerMexMessageDraftService, typeForChannel };
