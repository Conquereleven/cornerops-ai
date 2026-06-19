const env = require('../../config/env');
const openclaw = require('../../integrations/openclaw');
const agents = require('../agents');
const context = require('../context');
const data = require('../data');
const { ControlTowerService } = require('./ControlTowerService');

const controlTowerService = new ControlTowerService({
  agentAuditService: agents.agentAuditService,
  agentRegistry: agents.agentRegistry,
  auditLogService: data.auditLogService,
  config: env,
  contextHealthService: context.contextHealthService,
  dataHealthService: data.dataHealthService,
  ecosystemRegistry: data.ecosystemRegistry,
  githubClient: data.githubClient,
  humanApprovalService: openclaw.humanApprovalService,
  openclawAuditService: openclaw.auditLogService,
  openclawConfig: openclaw.config,
});

module.exports = {
  ControlTowerService,
  controlTowerService,
};
