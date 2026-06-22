const env = require('../../config/env');
const agents = require('../agents');
const context = require('../context');
const controlTower = require('../control-tower');
const data = require('../data');
const openclaw = require('../../integrations/openclaw');
const { OperatorCommandRouter } = require('./OperatorCommandRouter');
const { OperatorResponseFormatter } = require('./OperatorResponseFormatter');
const { OperatorSessionService } = require('./OperatorSessionService');

const operatorSessionService = new OperatorSessionService();
const operatorResponseFormatter = new OperatorResponseFormatter({
  maxResponseChars: env.corneropsOperatorMaxResponseChars,
  showApprovalStatus: env.corneropsOperatorShowApprovalStatus,
  showAuditId: env.corneropsOperatorShowAuditId,
  showSourceLabels: env.corneropsOperatorShowSourceLabels,
});
const operatorCommandRouter = new OperatorCommandRouter({
  agentAuditService: agents.agentAuditService,
  agentOrchestrator: agents.agentOrchestrator,
  approvalService: data.approvalService,
  auditLogService: data.auditLogService,
  config: {
    allowedChannels: env.corneropsOperatorAllowedChannels,
    defaultAgent: env.corneropsOperatorDefaultAgent,
    dryRun: env.corneropsOperatorDryRun,
    enabled: env.corneropsOperatorInterfaceEnabled,
    readOnly: env.corneropsOperatorReadOnly,
    requireApproval: env.corneropsOperatorRequireApproval,
    requireAudit: env.corneropsRequireAuditForOperatorRequests,
  },
  contextHealthService: context.contextHealthService,
  controlTowerService: controlTower.controlTowerService,
  dataHealthService: data.dataHealthService,
  formatter: operatorResponseFormatter,
  openclawAuditService: openclaw.auditLogService,
  sessionService: operatorSessionService,
});

module.exports = {
  OperatorCommandRouter,
  OperatorResponseFormatter,
  OperatorSessionService,
  operatorCommandRouter,
  operatorResponseFormatter,
  operatorSessionService,
};
