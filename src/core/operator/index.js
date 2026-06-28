const env = require('../../config/env');
const actions = require('../actions');
const agents = require('../agents');
const context = require('../context');
const controlTower = require('../control-tower');
const data = require('../data');
const { CornerMexMessageDraftService, MessageDraftPolicy } = require('../drafts');
const { CornerMexFlowEngine } = require('../flows/cornermex');
const openclaw = require('../../integrations/openclaw');
const { OperatorCommandRouter } = require('./OperatorCommandRouter');
const { OperatorResponseFormatter } = require('./OperatorResponseFormatter');
const { OperatorSessionService } = require('./OperatorSessionService');
const { persistenceProviderRegistry } = require('../persistence');

const operatorSessionService = new OperatorSessionService({
  store: persistenceProviderRegistry.createStore('operator-sessions', {
    initialData: { version: 1, records: [] },
    provider: env.corneropsSessionStoreProvider,
  }),
});
const operatorResponseFormatter = new OperatorResponseFormatter({
  maxResponseChars: env.corneropsOperatorMaxResponseChars,
  showApprovalStatus: env.corneropsOperatorShowApprovalStatus,
  showAuditId: env.corneropsOperatorShowAuditId,
  showSourceLabels: env.corneropsOperatorShowSourceLabels,
});
const cornerMexFlowEngine = new CornerMexFlowEngine({
  auditLogService: data.auditLogService,
  connector: data.lovableCornerMexConnector,
});
const cornerMexMessageDraftService = new CornerMexMessageDraftService({
  auditLogService: data.auditLogService,
  policy: new MessageDraftPolicy({
    dryRun: env.corneropsTelegramDryRun !== false,
    piiMasking: env.corneropsPiiMasking !== false,
    readOnly: env.corneropsTelegramReadOnly !== false,
  }),
});
const operatorCommandRouter = new OperatorCommandRouter({
  agentAuditService: agents.agentAuditService,
  agentOrchestrator: agents.agentOrchestrator,
  approvalService: data.approvalService,
  auditLogService: data.auditLogService,
  controlledActionExecutor: actions.controlledActionExecutor,
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
  controlTowerService: controlTower.controlTowerV11ReportService || controlTower.controlTowerService,
  dataHealthService: data.dataHealthService,
  flowEngine: cornerMexFlowEngine,
  formatter: operatorResponseFormatter,
  messageDraftService: cornerMexMessageDraftService,
  openclawAuditService: openclaw.auditLogService,
  sessionService: operatorSessionService,
});

module.exports = {
  OperatorCommandRouter,
  OperatorResponseFormatter,
  OperatorSessionService,
  cornerMexFlowEngine,
  cornerMexMessageDraftService,
  operatorCommandRouter,
  operatorResponseFormatter,
  operatorSessionService,
};
