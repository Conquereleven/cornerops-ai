const { AUDIT_STATUS, POLICY_DECISIONS } = require('./types');
const { OpenClawPolicyError } = require('./errors');

class CornerOpsOpenClawAdapter {
  constructor({
    auditLogService,
    client,
    config,
    humanApprovalService,
    memoryBridge,
    toolExecutionPolicy,
  }) {
    this.auditLogService = auditLogService;
    this.client = client;
    this.config = config;
    this.humanApprovalService = humanApprovalService;
    this.memoryBridge = memoryBridge;
    this.toolExecutionPolicy = toolExecutionPolicy;
  }

  toOpenClawChatInput(message) {
    const session = this.memoryBridge.toOpenClawSession(message);
    return {
      model: this.config.defaultModel,
      user: message.conversationId,
      messages: [
        {
          role: 'user',
          content: message.text,
        },
      ],
      metadata: {
        requestId: message.requestId,
        correlationId: message.correlationId,
        corneropsMessageId: message.messageId,
        conversationId: message.conversationId,
        channel: message.channel,
        channelId: message.channelId,
        company: message.businessContext?.company,
        workspace: message.businessContext?.workspace,
        actionType: message.actionType,
        session,
      },
    };
  }

  fromOpenClawChatResult(result, message) {
    const reply =
      result?.choices?.[0]?.message?.content ||
      result?.output_text ||
      result?.response ||
      '';
    return {
      reply,
      source: 'openclaw',
      conversationId: message.conversationId,
      requestId: message.requestId,
      metadata: {
        channel: message.channel,
        rawOpenClawId: result?.id,
      },
    };
  }

  async handleMessage(message) {
    const startedAt = Date.now();
    const policy = this.toolExecutionPolicy.evaluate(message);
    if (!policy.allowed) {
      this.audit(message, policy, AUDIT_STATUS.ERROR, {
        errorCode: 'OPENCLAW_POLICY_DENIED',
      });
      throw new OpenClawPolicyError(policy.reason, {
        decision: policy.policyDecision,
      });
    }
    if (policy.requiresApproval) {
      const approval = this.humanApprovalService.createApproval({
        actionType: message.actionType,
        channel: message.channel,
        conversationId: message.conversationId,
        createdBy: message.userId,
        impact: 'No tool will run until a human approves this action.',
        payload: {
          text: message.text,
          toolName: message.toolName,
          metadata: message.metadata,
        },
        reason: policy.reason,
        requestId: message.requestId,
        toolName: message.toolName,
      });
      this.audit(message, policy, AUDIT_STATUS.PENDING, {
        approvalId: approval.id,
        latencyMs: Date.now() - startedAt,
      });
      return {
        status: 'approval_required',
        approvalId: approval.id,
        policyDecision: policy.policyDecision,
        dryRun: this.config.dryRun,
        reply: 'Esta acción requiere aprobación humana antes de ejecutarse.',
      };
    }
    if (!this.config.enabled || this.config.dryRun || policy.draftOnly) {
      const status = !this.config.enabled
        ? 'disabled'
        : policy.draftOnly ? 'draft_only' : 'dry_run';
      this.audit(message, policy, AUDIT_STATUS.SUCCESS, {
        latencyMs: Date.now() - startedAt,
        output: { status },
      });
      return {
        status,
        policyDecision: policy.policyDecision,
        dryRun: true,
        openclawRequest: this.toOpenClawChatInput(message),
        reply: this.draftReply(message, policy),
      };
    }
    try {
      const result = await this.client.chatCompletion(
        this.toOpenClawChatInput(message),
      );
      const mapped = this.fromOpenClawChatResult(result, message);
      this.audit(message, policy, AUDIT_STATUS.SUCCESS, {
        latencyMs: Date.now() - startedAt,
        output: mapped,
      });
      return {
        status: 'success',
        policyDecision: POLICY_DECISIONS.ALLOWED,
        ...mapped,
      };
    } catch (error) {
      const fallback = {
        status: 'fallback',
        policyDecision: policy.policyDecision,
        errorCode: error.code,
        reply: 'OpenClaw no respondió. CornerOps conserva el control y la acción queda sin ejecutar.',
      };
      this.audit(message, policy, AUDIT_STATUS.ERROR, {
        latencyMs: Date.now() - startedAt,
        output: fallback,
        errorCode: error.code,
        errorMessage: error.message,
      });
      return fallback;
    }
  }

  draftReply(message, policy) {
    if (policy.draftOnly) {
      return `Borrador preparado para ${message.channel}; no se enviará sin aprobación.`;
    }
    return 'OpenClaw está en modo dry run o desactivado; no se ejecutó ninguna acción externa.';
  }

  audit(message, policy, status, extra = {}) {
    return this.auditLogService.record({
      requestId: message.requestId,
      correlationId: message.correlationId,
      userId: message.userId,
      channel: message.channel,
      conversationId: message.conversationId,
      actionType: message.actionType,
      toolName: message.toolName,
      policyDecision: policy.policyDecision,
      status,
      input: message,
      output: extra.output,
      errorCode: extra.errorCode,
      errorMessage: extra.errorMessage,
      latencyMs: extra.latencyMs,
      approvalId: extra.approvalId,
    });
  }
}

module.exports = {
  CornerOpsOpenClawAdapter,
};
