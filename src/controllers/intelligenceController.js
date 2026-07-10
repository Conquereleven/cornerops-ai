const data = require('../core/data');
const env = require('../config/env');
const { CornerMexFlowEngine } = require('../core/flows/cornermex');
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

const flowEngine = new CornerMexFlowEngine({
  auditLogService: data.auditLogService,
  connector: data.lovableCornerMexConnector,
});

const intelligenceService = new IntelligenceService({
  auditLogService: data.auditLogService,
  connector: data.lovableCornerMexConnector,
  flowEngine,
});
const founderReviewService = new FounderReviewService({
  auditLogService: data.auditLogService,
  config: env,
  connector: data.lovableCornerMexConnector,
  intelligenceService,
});
const catalogCohortService = new CatalogCohortService({
  auditLogService: data.auditLogService,
  client: data.cornerMexSupabaseReadOnlyClient,
  config: env,
  connector: data.lovableCornerMexConnector,
});
const actionEngineService = new ActionEngineService({
  auditLogService: data.auditLogService,
  catalogCohortService,
  flowEngine,
  founderReviewService,
});
const productActivationEngine = new ProductActivationEngine({ catalogCohortService });
const environmentDoctorService = new EnvironmentDoctorService({ config: env });
const operatingStageEngine = new OperatingStageEngine({ config: env });
const capabilityMatrixService = new CapabilityMatrixService();
const liveControlTowerStatusService = new LiveControlTowerStatusService({
  actionEngine: actionEngineService,
  capabilityMatrixService,
  catalogCohortService,
  environmentDoctorService,
  founderReviewService,
  operatingStageEngine,
  productActivationEngine,
  config: env,
});

const requestId = (req, fallback) => req.get('x-request-id') || fallback;

const overview = async (req, res, next) => {
  try {
    return res.json(await intelligenceService.getOverview({ requestId: requestId(req, 'intelligence-overview-api') }));
  } catch (error) {
    return next(error);
  }
};

const clients = async (req, res, next) => {
  try {
    return res.json(await intelligenceService.listClients({ requestId: requestId(req, 'intelligence-clients-api') }));
  } catch (error) {
    return next(error);
  }
};

const signals = async (req, res, next) => {
  try {
    return res.json(await intelligenceService.listSignals({ requestId: requestId(req, 'intelligence-signals-api') }));
  } catch (error) {
    return next(error);
  }
};

const anomalies = async (req, res, next) => {
  try {
    return res.json(await intelligenceService.listAnomalies({ requestId: requestId(req, 'intelligence-anomalies-api') }));
  } catch (error) {
    return next(error);
  }
};

const cases = async (req, res, next) => {
  try {
    return res.json(await intelligenceService.listCases({ requestId: requestId(req, 'intelligence-cases-api') }));
  } catch (error) {
    return next(error);
  }
};

const createCaseFromAnomaly = async (req, res, next) => {
  try {
    return res.status(202).json(await intelligenceService.createCaseFromAnomaly(req.body || {}, {
      requestId: requestId(req, 'intelligence-case-from-anomaly-api'),
    }));
  } catch (error) {
    return next(error);
  }
};

const updateCaseStatus = async (req, res, next) => {
  try {
    return res.status(202).json(await intelligenceService.updateCaseStatus(req.params.id, req.body?.status || 'investigating', {
      requestId: requestId(req, 'intelligence-case-status-api'),
    }));
  } catch (error) {
    return next(error);
  }
};

const playbooks = async (_req, res, next) => {
  try {
    return res.json(await intelligenceService.listPlaybooks());
  } catch (error) {
    return next(error);
  }
};

const connectors = async (req, res, next) => {
  try {
    return res.json(await intelligenceService.listConnectors({ requestId: requestId(req, 'intelligence-connectors-api') }));
  } catch (error) {
    return next(error);
  }
};

const founderReview = async (req, res, next) => {
  try {
    return res.json(await founderReviewService.buildFounderReview({
      requestId: requestId(req, 'founder-review-api-v1.6'),
      userId: 'founder-review-api',
      channel: 'api',
    }));
  } catch (error) {
    return next(error);
  }
};

const controlTowerStatus = async (req, res, next) => {
  try {
    return res.json(await liveControlTowerStatusService.build({
      requestId: requestId(req, 'live-control-tower-status-api-v1.8'),
      userId: 'control-tower-api',
      channel: 'api',
    }));
  } catch (error) {
    return next(error);
  }
};

const actionEngine = async (req, res, next) => {
  try {
    return res.json(await actionEngineService.build({
      requestId: requestId(req, 'action-engine-api-v1.8'),
      userId: 'control-tower-api',
      channel: 'api',
    }));
  } catch (error) {
    return next(error);
  }
};

const actionEngineDrafts = async (req, res, next) => {
  try {
    return res.status(202).json(await actionEngineService.createDrafts({
      requestId: requestId(req, 'action-engine-drafts-api-v1.8'),
      userId: req.get('x-operator-id') || 'control-tower-api',
      channel: 'api',
    }));
  } catch (error) {
    return next(error);
  }
};

const productActivation = async (req, res, next) => {
  try {
    return res.json(await productActivationEngine.buildPlan({
      requestId: requestId(req, 'product-activation-api-v1.8'),
      userId: 'control-tower-api',
      channel: 'api',
    }));
  } catch (error) {
    return next(error);
  }
};

const environmentDoctor = async (_req, res, next) => {
  try {
    return res.json(environmentDoctorService.check());
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  actionEngine,
  actionEngineDrafts,
  anomalies,
  cases,
  clients,
  connectors,
  controlTowerStatus,
  createCaseFromAnomaly,
  environmentDoctor,
  founderReview,
  overview,
  playbooks,
  productActivation,
  signals,
  updateCaseStatus,
};
