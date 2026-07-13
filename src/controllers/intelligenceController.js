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
const {
  ApprovalEngineService,
  WorkQueueService,
  createInternalOperationsStore,
} = require('../core/work-queue');
const {
  SupplyGraphMatchService,
  SupplyGraphMatchStore,
  SupplyGraphService,
  SupplyGraphStore,
} = require('../core/supplygraph');

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
const internalOperationsStore = createInternalOperationsStore(env);
const workQueueService = new WorkQueueService({
  actionEngineService,
  config: env,
  store: internalOperationsStore,
});
const approvalEngineService = new ApprovalEngineService({ store: internalOperationsStore });
const supplyGraphStore = new SupplyGraphStore({ internalStore: internalOperationsStore });
const supplyGraphMatchStore = new SupplyGraphMatchStore({
  internalStore: internalOperationsStore,
  supplyGraphStore,
});
const supplyGraphMatchService = new SupplyGraphMatchService({
  config: env,
  matchStore: supplyGraphMatchStore,
});
const supplyGraphService = new SupplyGraphService({
  config: env,
  internalStore: internalOperationsStore,
  store: supplyGraphStore,
  matchStore: supplyGraphMatchStore,
  matchService: supplyGraphMatchService,
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

const actorContext = (req) => ({
  actorType: 'founder',
  actorId: req.founderActionAuth?.actorId || 'founder',
  correlationId: req.get('x-correlation-id') || requestId(req, `work-queue-${Date.now()}`),
});

const parseWorkQueueFilters = (query = {}) => ({
  status: query.status,
  priority: query.priority,
  sourceFlow: query.sourceFlow,
  actionType: query.actionType,
  approvalRequired: query.approvalRequired === undefined
    ? undefined : String(query.approvalRequired) === 'true',
  operatingStage: query.operatingStage,
  owner: query.owner,
  limit: query.limit,
  cursor: query.cursor,
});

const workQueueStatus = async (_req, res, next) => {
  try { return res.json(await workQueueService.status()); } catch (error) { return next(error); }
};

const listWorkQueue = async (req, res, next) => {
  try {
    const [items, status] = await Promise.all([
      workQueueService.list(parseWorkQueueFilters(req.query)),
      workQueueService.status(),
    ]);
    return res.json({ ...status, items });
  } catch (error) { return next(error); }
};

const getWorkItem = async (req, res, next) => {
  try {
    const item = await workQueueService.get(req.params.id);
    return item ? res.json({ item, writesBlocked: true, externalSendsBlocked: true })
      : res.status(404).json({ code: 'WORK_ITEM_NOT_FOUND', message: 'Work item not found.' });
  } catch (error) { return next(error); }
};

const syncWorkQueue = async (req, res, next) => {
  try {
    const context = actorContext(req);
    const result = await workQueueService.sync({ ...context, requestId: requestId(req, 'work-queue-sync-v1.9') });
    return res.status(202).json({
      status: 'success',
      ...result,
      executedExternalAction: false,
      productionMutationsBlocked: true,
      externalSendsBlocked: true,
    });
  } catch (error) { return next(error); }
};

const updateWorkItem = async (req, res, next) => {
  try {
    const item = await workQueueService.update(req.params.id, req.body || {}, actorContext(req));
    return item ? res.json({ item, productionMutationsBlocked: true, externalSendsBlocked: true })
      : res.status(404).json({ code: 'WORK_ITEM_NOT_FOUND', message: 'Work item not found.' });
  } catch (error) { return next(error); }
};

const listPersistentApprovals = async (req, res, next) => {
  try {
    const approvals = await approvalEngineService.list({ status: req.query.status, limit: req.query.limit });
    return res.json({ approvals, executed: false, executionStatus: 'not_available_in_current_version' });
  } catch (error) { return next(error); }
};

const getPersistentApproval = async (req, res, next) => {
  try {
    const approval = await approvalEngineService.get(req.params.id);
    return approval ? res.json({ approval, executed: false })
      : res.status(404).json({ code: 'APPROVAL_NOT_FOUND', message: 'Approval not found.' });
  } catch (error) { return next(error); }
};

const decidePersistentApproval = (decision) => async (req, res, next) => {
  try {
    const result = await approvalEngineService.decide(req.params.id, decision, {
      ...actorContext(req), reason: req.body?.reason,
    });
    return result ? res.json(result)
      : res.status(404).json({ code: 'APPROVAL_NOT_FOUND', message: 'Approval not found.' });
  } catch (error) { return next(error); }
};

const listPersistentAudit = async (req, res, next) => {
  try {
    const events = await workQueueService.listAudit({ eventType: req.query.eventType, limit: req.query.limit });
    return res.json({ events, appendOnly: true });
  } catch (error) { return next(error); }
};

const listPersistentDrafts = async (req, res, next) => {
  try {
    const drafts = await workQueueService.listDrafts({ limit: req.query.limit });
    return res.json({ drafts, externalSendsBlocked: true });
  } catch (error) { return next(error); }
};

const recordFounderActionAuthFailure = (event) => internalOperationsStore.recordAuditEvent(event);

const supplyGraphStatus = async (_req, res, next) => {
  try { return res.json(await supplyGraphService.status()); } catch (error) { return next(error); }
};

const listSupplyGraphSuppliers = async (req, res, next) => {
  try {
    const suppliers = await supplyGraphService.listSuppliers({
      status: req.query.status,
      supplierType: req.query.supplierType,
      countryCode: req.query.countryCode,
      verificationStatus: req.query.verificationStatus,
      limit: req.query.limit,
    });
    return res.json({ suppliers, cornerMexWritesBlocked: true, externalActionsBlocked: true });
  } catch (error) { return next(error); }
};

const getSupplyGraphSupplier = async (req, res, next) => {
  try {
    const supplier = await supplyGraphService.getSupplier(req.params.id);
    return supplier ? res.json({ supplier, cornerMexWritesBlocked: true, externalActionsBlocked: true })
      : res.status(404).json({ code: 'SUPPLYGRAPH_SUPPLIER_NOT_FOUND', message: 'Supplier not found.' });
  } catch (error) { return next(error); }
};

const listSupplyGraphCatalog = async (req, res, next) => {
  try {
    const items = await supplyGraphService.listCatalog({
      supplierId: req.query.supplierId,
      category: req.query.category,
      brand: req.query.brand,
      verificationStatus: req.query.verificationStatus,
      stockStatus: req.query.stockStatus,
      observedBefore: req.query.observedBefore,
      observedAfter: req.query.observedAfter,
      limit: req.query.limit,
      cursor: req.query.cursor,
      offset: req.query.offset,
    });
    return res.json({ items, cornerMexWritesBlocked: true, externalActionsBlocked: true });
  } catch (error) { return next(error); }
};

const listSupplyGraphDemands = async (req, res, next) => {
  try {
    const requests = await supplyGraphService.listDemands({
      status: req.query.status,
      priority: req.query.priority,
      emirate: req.query.emirate,
      customerSegment: req.query.customerSegment,
      sourceType: req.query.sourceType,
      limit: req.query.limit,
      cursor: req.query.cursor,
      offset: req.query.offset,
    });
    return res.json({ requests, matchingEngineStatus: 'not_implemented', externalActionsBlocked: true });
  } catch (error) { return next(error); }
};

const getSupplyGraphDemand = async (req, res, next) => {
  try {
    const demand = await supplyGraphService.getDemand(req.params.id);
    return demand ? res.json({ ...demand, matchingEngineStatus: 'not_implemented', externalActionsBlocked: true })
      : res.status(404).json({ code: 'SUPPLYGRAPH_DEMAND_NOT_FOUND', message: 'Demand request not found.' });
  } catch (error) { return next(error); }
};

const syncSupplyGraphIntermex = async (req, res, next) => {
  try {
    const result = await supplyGraphService.syncIntermex(actorContext(req));
    return res.status(202).json(result);
  } catch (error) { return next(error); }
};

const createSupplyGraphDemand = async (req, res, next) => {
  try {
    const result = await supplyGraphService.createDemand(req.body || {}, actorContext(req));
    return res.status(result.created ? 201 : 200).json({
      ...result, matchingEngineStatus: 'not_implemented', externalActionsBlocked: true,
    });
  } catch (error) { return next(error); }
};

const updateSupplyGraphDemand = async (req, res, next) => {
  try {
    const result = await supplyGraphService.updateDemand(req.params.id, req.body || {}, actorContext(req));
    return result ? res.json({ ...result, matchingEngineStatus: 'not_implemented', externalActionsBlocked: true })
      : res.status(404).json({ code: 'SUPPLYGRAPH_DEMAND_NOT_FOUND', message: 'Demand request not found.' });
  } catch (error) { return next(error); }
};

const matchSupplyGraphDemand = async (req, res, next) => {
  try {
    const result = await supplyGraphService.matchDemand(req.params.id, req.body || {}, actorContext(req));
    return res.status(result.reused ? 200 : 201).json(result);
  } catch (error) { return next(error); }
};

const listSupplyGraphMatchRuns = async (req, res, next) => {
  try {
    const matchRuns = await supplyGraphService.listMatchRuns({
      demandRequestId: req.query.demandRequestId,
      coverageStatus: req.query.coverageStatus,
      fulfillmentReadiness: req.query.fulfillmentReadiness,
      recommendationType: req.query.recommendationType,
      createdAfter: req.query.createdAfter,
      createdBefore: req.query.createdBefore,
      limit: req.query.limit,
      offset: req.query.offset || req.query.cursor,
    });
    return res.json({ matchRuns, comparisonScope: 'single_verified_supplier', marketComparisonPerformed: false, externalActionsBlocked: true });
  } catch (error) { return next(error); }
};

const getSupplyGraphMatchRun = async (req, res, next) => {
  try {
    const result = await supplyGraphService.getMatchRun(req.params.id);
    return result ? res.json({ ...result, externalActionsBlocked: true, productActivationBlocked: true })
      : res.status(404).json({ code: 'SUPPLYGRAPH_MATCH_RUN_NOT_FOUND', message: 'Match run not found.' });
  } catch (error) { return next(error); }
};

const listSupplyGraphDemandMatchRuns = async (req, res, next) => {
  try {
    const matchRuns = await supplyGraphService.listDemandMatchRuns(req.params.id, {
      limit: req.query.limit, offset: req.query.offset || req.query.cursor,
    });
    return res.json({ matchRuns, externalActionsBlocked: true });
  } catch (error) { return next(error); }
};

const latestSupplyGraphDemandMatch = async (req, res, next) => {
  try {
    const result = await supplyGraphService.latestDemandMatch(req.params.id);
    return result ? res.json({ ...result, externalActionsBlocked: true, productActivationBlocked: true })
      : res.status(404).json({ code: 'SUPPLYGRAPH_MATCH_RUN_NOT_FOUND', message: 'No match run exists for demand.' });
  } catch (error) { return next(error); }
};

module.exports = {
  actionEngine,
  actionEngineDrafts,
  approvalEngineService,
  anomalies,
  cases,
  clients,
  connectors,
  controlTowerStatus,
  createCaseFromAnomaly,
  environmentDoctor,
  founderReview,
  getPersistentApproval,
  getWorkItem,
  listPersistentApprovals,
  listPersistentAudit,
  listPersistentDrafts,
  listWorkQueue,
  overview,
  playbooks,
  productActivation,
  recordFounderActionAuthFailure,
  rejectPersistentApproval: decidePersistentApproval('rejected'),
  cancelPersistentApproval: decidePersistentApproval('cancelled'),
  approvePersistentApproval: decidePersistentApproval('approved'),
  signals,
  syncWorkQueue,
  supplyGraphService,
  supplyGraphStatus,
  listSupplyGraphSuppliers,
  getSupplyGraphSupplier,
  listSupplyGraphCatalog,
  listSupplyGraphDemands,
  getSupplyGraphDemand,
  syncSupplyGraphIntermex,
  createSupplyGraphDemand,
  updateSupplyGraphDemand,
  matchSupplyGraphDemand,
  listSupplyGraphMatchRuns,
  getSupplyGraphMatchRun,
  listSupplyGraphDemandMatchRuns,
  latestSupplyGraphDemandMatch,
  updateCaseStatus,
  updateWorkItem,
  workQueueService,
  workQueueStatus,
};
