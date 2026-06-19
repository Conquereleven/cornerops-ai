const env = require('../../config/env');
const openclaw = require('../../integrations/openclaw');
const agents = require('../agents');
const context = require('../context');
const data = require('../data');
const { ControlTowerService } = require('./ControlTowerService');
const { operatorChannelStatusStore } = require('../operator-channel/OperatorChannelStatusStore');

const controlTowerService = new ControlTowerService({
  agentAuditService: agents.agentAuditService,
  agentRegistry: agents.agentRegistry,
  auditLogService: data.auditLogService,
  businessDataService: data.businessDataService,
  config: env,
  contextHealthService: context.contextHealthService,
  dataHealthService: data.dataHealthService,
  dataContractRegistry: data.businessDataContractRegistry,
  ecosystemRegistry: data.ecosystemRegistry,
  githubClient: data.githubClient,
  humanApprovalService: openclaw.humanApprovalService,
  openclawAuditService: openclaw.auditLogService,
  openclawConfig: openclaw.config,
  schemaDiscoveryService: data.schemaDiscoveryService,
  operatorChannelStatusProvider: () => operatorChannelStatusStore.getStatus({
    enabled: env.corneropsRealOperatorChannelEnabled,
    provider: env.corneropsOperatorChannelProvider,
    dryRun: env.corneropsOperatorChannelDryRun,
    replyEnabled: env.corneropsOperatorReplyEnabled,
    replyDryRun: env.corneropsOperatorReplyDryRun,
    requireAllowlist: env.corneropsOperatorRequireAllowlist,
    allowedUserIds: [...new Set([
      ...env.corneropsOperatorAllowedUserIds,
      ...env.telegramOperatorAllowedUserIds,
      ...env.slackOperatorAllowedUserIds,
    ])],
    allowedChannelIds: [...new Set([
      ...env.corneropsOperatorAllowedChannelIds,
      ...env.slackOperatorAllowedChannelIds,
    ])],
    allowedChatIds: [...new Set([
      ...env.corneropsOperatorAllowedChatIds,
      ...env.telegramOperatorAllowedChatIds,
    ])],
  }),
});

module.exports = {
  ControlTowerService,
  controlTowerService,
};
