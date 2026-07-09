const data = require('../core/data');
const { CornerMexFlowEngine } = require('../core/flows/cornermex');
const { FounderReviewService, IntelligenceService } = require('../core/intelligence');

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
  intelligenceService,
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

module.exports = {
  anomalies,
  cases,
  clients,
  connectors,
  createCaseFromAnomaly,
  founderReview,
  overview,
  playbooks,
  signals,
  updateCaseStatus,
};
