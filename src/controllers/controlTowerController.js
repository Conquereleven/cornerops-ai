const {
  approvalCenterService,
  auditViewerService,
  controlTowerService,
  controlTowerV08ReportService,
  controlTowerV09ReportService,
  controlTowerV10ReportService,
  controlTowerV11ReportService,
} = require('../core/control-tower');
const operatorChannel = require('../core/operator-channel');

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
