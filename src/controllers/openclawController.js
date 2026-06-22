const {
  adapter,
  auditLogService,
  channelRouter,
  client,
  config,
  humanApprovalService,
} = require('../integrations/openclaw');
const { agentOrchestrator } = require('../core/agents');

const health = async (req, res, next) => {
  try {
    if (!config.enabled) {
      return res.json({
        status: 'disabled',
        enabled: false,
        dryRun: config.dryRun,
        baseUrl: config.baseUrl,
      });
    }
    return res.json(await client.healthCheck({
      requestId: req.get('x-request-id'),
    }));
  } catch (error) {
    return next(error);
  }
};

const receiveMessage = async (req, res, next) => {
  try {
    const routed = channelRouter.route({
      ...req.body,
      requestId: req.body.requestId || req.get('x-request-id'),
      correlationId: req.body.correlationId || req.get('x-correlation-id'),
    });
    const agentResult = await agentOrchestrator.handleMessage(routed);
    const result = await adapter.handleMessage(routed);
    return res.json({ routed, result, agentResult });
  } catch (error) {
    return next(error);
  }
};

const createApproval = async (req, res, next) => {
  try {
    const approval = humanApprovalService.createApproval({
      actionType: req.body.actionType,
      channel: req.body.channel || 'internal',
      conversationId: req.body.conversationId,
      createdBy: req.body.createdBy || 'operator',
      impact: req.body.impact,
      payload: req.body.payload,
      reason: req.body.reason,
      requestId: req.body.requestId || req.get('x-request-id'),
      toolName: req.body.toolName,
    });
    auditLogService.record({
      requestId: approval.requestId,
      userId: approval.createdBy,
      channel: approval.channel,
      conversationId: approval.conversationId,
      actionType: approval.actionType,
      toolName: approval.toolName,
      policyDecision: 'requires_confirmation',
      status: 'pending',
      input: approval.payloadSummary,
      approvalId: approval.id,
    });
    return res.status(201).json(approval);
  } catch (error) {
    return next(error);
  }
};

const getApproval = (req, res) => {
  const approval = humanApprovalService.getApproval(req.params.id);
  if (!approval) {
    return res.status(404).json({ error: true, message: 'Approval not found.' });
  }
  return res.json(approval);
};

const listApprovals = (req, res) =>
  res.json(humanApprovalService.list({
    status: req.query.status,
    limit: req.query.limit,
  }));

const approve = (req, res, next) => {
  try {
    const approval = humanApprovalService.approve(
      req.params.id,
      req.body.approver || 'operator',
    );
    if (!approval) {
      return res.status(404).json({ error: true, message: 'Approval not found.' });
    }
    auditLogService.record({
      requestId: approval.requestId,
      userId: approval.resolvedBy,
      channel: approval.channel,
      conversationId: approval.conversationId,
      actionType: approval.actionType,
      toolName: approval.toolName,
      policyDecision: 'requires_confirmation',
      status: 'approved',
      approvalId: approval.id,
    });
    return res.json(approval);
  } catch (error) {
    return next(error);
  }
};

const reject = (req, res, next) => {
  try {
    const approval = humanApprovalService.reject(
      req.params.id,
      req.body.approver || 'operator',
    );
    if (!approval) {
      return res.status(404).json({ error: true, message: 'Approval not found.' });
    }
    auditLogService.record({
      requestId: approval.requestId,
      userId: approval.resolvedBy,
      channel: approval.channel,
      conversationId: approval.conversationId,
      actionType: approval.actionType,
      toolName: approval.toolName,
      policyDecision: 'requires_confirmation',
      status: 'rejected',
      approvalId: approval.id,
    });
    return res.json(approval);
  } catch (error) {
    return next(error);
  }
};

const listAuditLogs = (req, res) =>
  res.json(auditLogService.list({ limit: req.query.limit }));

module.exports = {
  approve,
  createApproval,
  getApproval,
  health,
  listApprovals,
  listAuditLogs,
  receiveMessage,
  reject,
};
