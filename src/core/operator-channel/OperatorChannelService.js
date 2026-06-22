const { sanitizeMessage } = require('../security/SecuritySanitizer');

class OperatorChannelService {
  constructor({
    auditLogService,
    chatFormatter,
    config,
    normalizer,
    policy,
    responseService,
    router,
    statusStore,
    rejectionTrackingService,
  } = {}) {
    this.auditLogService = auditLogService;
    this.chatFormatter = chatFormatter;
    this.config = config;
    this.normalizer = normalizer;
    this.policy = policy;
    this.responseService = responseService;
    this.router = router;
    this.statusStore = statusStore;
    this.rejectionTrackingService = rejectionTrackingService;
  }

  async handleInbound(input = {}) {
    let message;
    try {
      message = this.normalizer.normalize(input);
    } catch (error) {
      return this.failClosed(input, error.code || 'OPERATOR_CHANNEL_NORMALIZATION_FAILED');
    }
    const decision = this.policy.evaluate(message);
    this.statusStore.recordInbound({ at: message.receivedAt, rejected: !decision.allowed });
    const inboundAudit = await this.auditLogService?.record({
      requestId: message.id,
      correlationId: `${message.provider}:${message.chatId || message.channelId}`,
      eventType: 'operator_channel_inbound',
      dataSource: 'operator_channel',
      operation: 'receive_operator_message',
      userId: message.userId,
      channel: message.provider,
      policyDecision: decision.allowed ? 'allowed' : 'denied',
      status: decision.allowed ? 'success' : 'denied',
      sanitizedInput: {
        provider: message.provider,
        channelId: message.channelId,
        chatId: message.chatId,
        userId: message.userId,
        messageLength: message.text.length,
        metadata: message.metadata,
      },
      errorCode: decision.allowed ? undefined : decision.code,
    });
    if (this.config.requireAudit && !inboundAudit) {
      return this.blocked(
        message,
        { ...decision, allowed: false, replyAllowed: false },
        'Operator channel audit is required.',
        'OPERATOR_CHANNEL_AUDIT_REQUIRED',
      );
    }
    if (!decision.allowed) {
      await this.rejectionTrackingService?.record({
        provider: message.provider,
        reason: decision.code || 'operator_channel_policy_error',
        riskLevel: decision.riskLevel,
        chatId: message.chatId || message.channelId,
        userId: message.userId,
        username: message.username,
        messageId: message.id,
        text: message.text,
        auditId: inboundAudit?.id,
      });
      return this.blocked(message, decision, decision.reason, decision.code, inboundAudit?.id);
    }
    try {
      const output = await this.router.route(message);
      const text = this.chatFormatter.format({ ...output, auditId: output.auditId || inboundAudit?.id });
      const response = await this.responseService.reply(message, {
        text,
        auditId: output.auditId || inboundAudit?.id,
        warnings: output.warnings,
        policy: decision,
      });
      await this.auditOutbound(message, response, decision);
      return response;
    } catch (error) {
      const failed = await this.blocked(
        message,
        { ...decision, allowed: false, replyAllowed: true },
        'CornerOps could not process this message. No action was executed.',
        error.code || 'OPERATOR_CHANNEL_PROCESSING_ERROR',
        inboundAudit?.id,
      );
      return failed;
    }
  }

  async blocked(message, decision, answerText, code, auditId) {
    const text = this.chatFormatter.format({
      status: 'denied',
      answerText,
      sourceMode: 'disabled',
      approvals: { required: Boolean(decision.requiresApproval) },
      auditId,
      warnings: [...(decision.warnings || []), code].filter(Boolean),
    });
    const response = await this.responseService.reply(message, {
      text,
      auditId,
      warnings: [...(decision.warnings || []), code].filter(Boolean),
      policy: decision,
    });
    response.status = 'blocked';
    await this.auditOutbound(message, response, decision);
    return response;
  }

  async failClosed(input, code) {
    this.statusStore.recordInbound({ rejected: true });
    const audit = await this.auditLogService?.record({
      requestId: input.id,
      eventType: 'operator_channel_inbound',
      dataSource: 'operator_channel',
      operation: 'reject_invalid_message',
      userId: input.userId || 'unknown',
      channel: input.provider || 'unknown',
      policyDecision: 'denied',
      status: 'denied',
      sanitizedInput: {
        provider: input.provider || 'unknown',
        hasUserId: Boolean(input.userId),
        hasDestination: Boolean(input.chatId || input.channelId),
        messageLength: String(input.text || '').length,
      },
      errorCode: code,
    });
    return {
      messageId: sanitizeMessage(String(input.id || 'unknown')),
      provider: input.provider || 'unknown',
      text: 'CornerOps rejected this message because required channel metadata is invalid.',
      status: 'blocked',
      auditId: audit?.id,
      warnings: [code],
    };
  }

  auditOutbound(message, response, decision, error) {
    return this.auditLogService?.record({
      requestId: message.id,
      correlationId: `${message.provider}:${message.chatId || message.channelId}`,
      eventType: 'operator_channel_outbound',
      dataSource: 'operator_channel',
      operation: 'reply_to_operator',
      userId: message.userId,
      channel: message.provider,
      policyDecision: decision.allowed ? 'allowed' : 'denied',
      status: response.status,
      sanitizedOutput: {
        provider: response.provider,
        channelId: response.channelId,
        chatId: response.chatId,
        responseLength: response.text?.length || 0,
        status: response.status,
      },
      errorCode: error?.code,
      errorMessage: error?.message,
    });
  }
}

module.exports = { OperatorChannelService };
