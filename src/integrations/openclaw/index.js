const { AuditLogService } = require('./AuditLogService');
const { ChannelRouter } = require('./ChannelRouter');
const { CornerOpsOpenClawAdapter } = require('./CornerOpsOpenClawAdapter');
const { HumanApprovalService } = require('./HumanApprovalService');
const { MemoryBridge } = require('./MemoryBridge');
const { OpenClawGatewayClient } = require('./OpenClawGatewayClient');
const { ToolExecutionPolicy } = require('./ToolExecutionPolicy');
const { getOpenClawConfig } = require('./OpenClawConfig');
const { OpenClawOperatorChannelBridge } = require('./OpenClawOperatorChannelBridge');

const config = getOpenClawConfig();
const auditLogService = new AuditLogService({
  enabled: config.auditEnabled,
});
const humanApprovalService = new HumanApprovalService();
const toolExecutionPolicy = new ToolExecutionPolicy({
  auditEnabled: config.auditEnabled,
  requireApproval: config.requireApproval,
  requireAudit: true,
  allowedTools: config.allowedTools,
});
const memoryBridge = new MemoryBridge();
const client = new OpenClawGatewayClient({ config });
const channelRouter = new ChannelRouter({ config });
const adapter = new CornerOpsOpenClawAdapter({
  auditLogService,
  client,
  config,
  humanApprovalService,
  memoryBridge,
  toolExecutionPolicy,
});

module.exports = {
  adapter,
  auditLogService,
  channelRouter,
  client,
  config,
  humanApprovalService,
  memoryBridge,
  toolExecutionPolicy,
  AuditLogService,
  ChannelRouter,
  CornerOpsOpenClawAdapter,
  HumanApprovalService,
  MemoryBridge,
  OpenClawGatewayClient,
  OpenClawOperatorChannelBridge,
  ToolExecutionPolicy,
  getOpenClawConfig,
};
