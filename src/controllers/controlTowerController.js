const {
  approvalCenterService,
  auditViewerService,
  controlTowerService,
  controlTowerV08ReportService,
  controlTowerV09ReportService,
  controlTowerV10ReportService,
  controlTowerV11ReportService,
} = require('../core/control-tower');
const actions = require('../core/actions');
const data = require('../core/data');
const { CornerMexFlowEngine } = require('../core/flows/cornermex');
const { CornerMexMessageDraftService } = require('../core/drafts');
const env = require('../config/env');
const {
  ActionEngineService,
  CatalogCohortService,
  CapabilityMatrixService,
  EnvironmentDoctorService,
  FounderReviewService,
  IntelligenceService,
  LiveControlTowerStatusService,
  OperatingStageEngine,
  ProductActivationEngine,
} = require('../core/intelligence');
const operatorChannel = require('../core/operator-channel');
const { ControlTowerFrontendContract } = require('../api/contracts/controlTowerFrontendContract');

const controlTowerFrontendFlowEngine = new CornerMexFlowEngine({
  auditLogService: data.auditLogService,
  connector: data.lovableCornerMexConnector,
});
const controlTowerFrontendDraftService = new CornerMexMessageDraftService({
  auditLogService: data.auditLogService,
});
const controlTowerFrontendIntelligenceService = new IntelligenceService({
  auditLogService: data.auditLogService,
  connector: data.lovableCornerMexConnector,
  flowEngine: controlTowerFrontendFlowEngine,
});
const controlTowerFrontendFounderReviewService = new FounderReviewService({
  auditLogService: data.auditLogService,
  config: env,
  connector: data.lovableCornerMexConnector,
  intelligenceService: controlTowerFrontendIntelligenceService,
});
const controlTowerFrontendCatalogCohortService = new CatalogCohortService({
  auditLogService: data.auditLogService,
  client: data.cornerMexSupabaseReadOnlyClient,
  config: env,
  connector: data.lovableCornerMexConnector,
});
const controlTowerFrontendActionEngineService = new ActionEngineService({
  auditLogService: data.auditLogService,
  catalogCohortService: controlTowerFrontendCatalogCohortService,
  flowEngine: controlTowerFrontendFlowEngine,
  founderReviewService: controlTowerFrontendFounderReviewService,
});
const controlTowerFrontendProductActivationEngine = new ProductActivationEngine({
  catalogCohortService: controlTowerFrontendCatalogCohortService,
});
const controlTowerFrontendEnvironmentDoctorService = new EnvironmentDoctorService({ config: env });
const controlTowerFrontendLiveStatusService = new LiveControlTowerStatusService({
  actionEngine: controlTowerFrontendActionEngineService,
  capabilityMatrixService: new CapabilityMatrixService(),
  catalogCohortService: controlTowerFrontendCatalogCohortService,
  environmentDoctorService: controlTowerFrontendEnvironmentDoctorService,
  founderReviewService: controlTowerFrontendFounderReviewService,
  operatingStageEngine: new OperatingStageEngine({ config: env }),
  productActivationEngine: controlTowerFrontendProductActivationEngine,
  config: env,
});

const controlTowerFrontendContract = new ControlTowerFrontendContract({
  approvalCenterService,
  auditViewerService,
  controlTowerReportService: controlTowerV11ReportService,
  controlledActionExecutor: actions.controlledActionExecutor,
  flowEngine: controlTowerFrontendFlowEngine,
  liveControlTowerStatusService: controlTowerFrontendLiveStatusService,
  actionEngineService: controlTowerFrontendActionEngineService,
  productActivationEngine: controlTowerFrontendProductActivationEngine,
  messageDraftService: controlTowerFrontendDraftService,
});

const status = async (req, res, next) => {
  try {
    return res.json(await controlTowerService.getReport());
  } catch (error) {
    return next(error);
  }
};

const beta = async (req, res, next) => {
  try {
    return res.json(await controlTowerService.getBetaReport());
  } catch (error) {
    return next(error);
  }
};

const dataContracts = async (req, res, next) => {
  try {
    await controlTowerService.businessDataService.ensureReady({ agentId: 'control-tower-api' });
    return res.json(controlTowerService.dataContractRegistry.listMappings());
  } catch (error) {
    return next(error);
  }
};

const schemaDiscovery = async (req, res, next) => {
  try {
    await controlTowerService.businessDataService.ensureReady({ agentId: 'control-tower-api' });
    return res.json(controlTowerService.businessDataService.getSchemaReport());
  } catch (error) {
    return next(error);
  }
};

const security = (req, res) => res.json(controlTowerService.getSecurityReport());

const approvals = async (req, res, next) => {
  try {
    return res.json(await controlTowerService.getApprovalsSummary());
  } catch (error) {
    return next(error);
  }
};

const auditSummary = async (req, res, next) => {
  try {
    return res.json(await controlTowerService.getAuditSummary());
  } catch (error) {
    return next(error);
  }
};

const v08 = async (req, res, next) => {
  try {
    return res.json(await controlTowerV08ReportService.getReport());
  } catch (error) {
    return next(error);
  }
};

const v09 = async (_req, res, next) => {
  try {
    return res.json(await controlTowerV09ReportService.getReport());
  } catch (error) {
    return next(error);
  }
};

const v10 = async (_req, res, next) => {
  try {
    return res.json(await controlTowerV10ReportService.getReport());
  } catch (error) {
    return next(error);
  }
};

const v11 = async (_req, res, next) => {
  try {
    return res.json(await controlTowerV11ReportService.getReport());
  } catch (error) {
    return next(error);
  }
};

const frontendAll = async (_req, res, next) => {
  try {
    return res.json(await controlTowerFrontendContract.getAllSections());
  } catch (error) {
    return next(error);
  }
};

const frontendConnectionTest = async (req, res, next) => {
  try {
    return res.json(await controlTowerFrontendContract.getConnectionTest({
      auditId: req.controlTowerFrontendAuth?.auditId,
      authMode: req.controlTowerFrontendAuth?.authMode,
      origin: req.get('origin') || '',
    }));
  } catch (error) {
    return next(error);
  }
};

const frontendSection = (sectionName) => async (_req, res, next) => {
  try {
    return res.json(await controlTowerFrontendContract.getSection(sectionName));
  } catch (error) {
    return next(error);
  }
};

const section = (key) => async (_req, res, next) => {
  try {
    const report = await controlTowerV08ReportService.getReport();
    return res.json(report[key]);
  } catch (error) {
    return next(error);
  }
};

const approvalList = async (req, res, next) => {
  try {
    return res.json(await approvalCenterService.list({
      limit: req.query.limit,
      status: req.query.status,
    }));
  } catch (error) {
    return next(error);
  }
};

const approvalDecision = (decision) => async (req, res, next) => {
  try {
    return res.json(await approvalCenterService.decideDryRun(
      req.params.id,
      decision,
      req.get('x-operator-id') || 'web-console-operator',
    ));
  } catch (error) {
    return next(error);
  }
};

const auditEvents = async (req, res, next) => {
  try {
    return res.json(await auditViewerService.getEvents({
      filter: req.query.filter,
      limit: req.query.limit,
    }));
  } catch (error) {
    return next(error);
  }
};

const rejections = async (req, res, next) => {
  try {
    return res.json(await auditViewerService.getRejections({ limit: req.query.limit }));
  } catch (error) {
    return next(error);
  }
};

const replay = async (_req, res, next) => {
  try {
    const [health, records] = await Promise.all([
      operatorChannel.replayProtectionService.health(),
      operatorChannel.replayProtectionService.store?.list?.() || Promise.resolve([]),
    ]);
    return res.json({
      healthy: health.healthy,
      provider: health.provider,
      recordCount: records.length,
      recordsExposed: false,
    });
  } catch (error) {
    return next(error);
  }
};

const rateLimits = async (_req, res, next) => {
  try {
    const health = await operatorChannel.operatorRateLimitService.health();
    return res.json({
      healthy: health.healthy,
      provider: health.provider,
      identitiesExposed: false,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  agentsV08: section('agents'),
  approvalList,
  approveDryRun: approvalDecision('approve'),
  approvals,
  auditEvents,
  auditSummary,
  beta,
  contextSourcesV08: section('contextSources'),
  dataContracts,
  dataSourcesV08: section('dataSources'),
  firstRealSourceV08: section('firstRealSource'),
  frontendActions: frontendSection('actions'),
  frontendAll,
  frontendConnectionTest,
  frontendApprovals: frontendSection('approvals'),
  frontendAudit: frontendSection('audit'),
  frontendCornerMex: frontendSection('cornermex'),
  frontendDrafts: frontendSection('drafts'),
  frontendFlows: frontendSection('flows'),
  frontendFounderDaily: frontendSection('founder-daily'),
  frontendSecurity: frontendSection('security'),
  frontendStatus: frontendSection('status'),
  frontendTelegram: frontendSection('telegram'),
  rateLimits,
  rejections,
  rejectDryRun: approvalDecision('reject'),
  replay,
  schemaDiscovery,
  security,
  securityV08: section('security'),
  status,
  telegramV08: section('operatorChannel'),
  v08,
  v09,
  v10,
  v11,
};
