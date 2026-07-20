const data = require('../core/data');
const env = require('../config/env');
const { CornerMexProgramStateService } = require('../integrations/cornermex');
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
  SupplierEvidenceResolver,
  SupplierEvidenceService,
  SupplierEvidenceStore,
  AuthorizedSellerNetworkService,
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
const cornerMexProgramStateService = new CornerMexProgramStateService({
  evidenceRoot: env.cornermexProgramEvidenceRoot,
  maxAgeMs: env.cornermexProgramEvidenceMaxAgeMs,
});
const approvalEngineService = new ApprovalEngineService({ store: internalOperationsStore });
const supplyGraphStore = new SupplyGraphStore({ internalStore: internalOperationsStore });
const supplierEvidenceResolver = new SupplierEvidenceResolver();
const supplierEvidenceStore = new SupplierEvidenceStore({
  internalStore: internalOperationsStore,
  supplyGraphStore,
});
const supplierEvidenceService = new SupplierEvidenceService({
  config: env,
  resolver: supplierEvidenceResolver,
  store: supplierEvidenceStore,
});
const supplyGraphMatchStore = new SupplyGraphMatchStore({
  internalStore: internalOperationsStore,
  supplyGraphStore,
  evidenceStore: supplierEvidenceStore,
  evidenceResolver: supplierEvidenceResolver,
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
  evidenceService: supplierEvidenceService,
});
const authorizedSellerNetworkService = new AuthorizedSellerNetworkService({ config: env, store: supplyGraphStore });
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
    const programState = await cornerMexProgramStateService.read();
    const programSync = await workQueueService.syncProgramState(programState, context).catch(() => ({
      status: 'unavailable',
      createdWorkItems: 0,
      blocker: 'cornerops_internal_persistence_unavailable',
    }));
    return res.status(202).json({
      status: 'success',
      ...result,
      programState: { status: programState.status, evidenceChecksum: programState.evidenceChecksum },
      programSync,
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
  try { return res.json({ ...(await supplyGraphService.status()), authorizedSellerNetwork: await authorizedSellerNetworkService.status() }); } catch (error) { return next(error); }
};

const authorizedSellerSafety = { writesBlocked:true, externalContactBlocked:true, purchasingBlocked:true, quoteGenerationBlocked:true, marketComparisonPerformed:false };
const listAuthorizedSellers = async(req,res,next)=>{try{return res.json({sellers:authorizedSellerNetworkService.registry(req.query),...authorizedSellerSafety});}catch(error){return next(error);}};
const getAuthorizedSeller = async(req,res,next)=>{try{const seller=authorizedSellerNetworkService.seller(req.params.sellerKey);return seller?res.json({seller,...authorizedSellerSafety}):res.status(404).json({code:'SUPPLYGRAPH_AUTHORIZED_SELLER_NOT_FOUND'});}catch(error){return next(error);}};
const previewSellerOnboarding = async(req,res,next)=>{try{const result=authorizedSellerNetworkService.preview(req.params.sellerKey);return result?res.json({...result,...authorizedSellerSafety}):res.status(404).json({code:'SUPPLYGRAPH_AUTHORIZED_SELLER_NOT_FOUND'});}catch(error){return next(error);}};
const createSellerOnboardingPackage = async(req,res,next)=>{try{const result=await authorizedSellerNetworkService.createPackage(req.params.sellerKey,actorContext(req));return result?res.status(result.reused?200:201).json({...result,...authorizedSellerSafety}):res.status(404).json({code:'SUPPLYGRAPH_AUTHORIZED_SELLER_NOT_FOUND'});}catch(error){return next(error);}};
const createSellerOnboardingPackageFromBody=async(req,res,next)=>{try{const key=req.body?.sellerCanonicalKey||req.body?.sellerKey;const result=await authorizedSellerNetworkService.createPackage(key,actorContext(req));return result?res.status(result.reused?200:201).json({...result,...authorizedSellerSafety}):res.status(404).json({code:'SUPPLYGRAPH_AUTHORIZED_SELLER_NOT_FOUND'});}catch(error){return next(error);}};
const createSellerOnboardingPackageFromSnapshot=async(req,res,next)=>{try{const result=await authorizedSellerNetworkService.createFromSnapshot(req.body||{},actorContext(req));return result?res.status(result.reused?200:201).json({...result,...authorizedSellerSafety}):res.status(404).json({code:'SUPPLYGRAPH_AUTHORIZED_SELLER_NOT_FOUND'});}catch(error){return next(error);}};
const applySellerOnboardingPackage = async(req,res,next)=>{try{const result=await authorizedSellerNetworkService.apply(req.params.id,req.body||{},actorContext(req));return result?res.json({...result,...authorizedSellerSafety}):res.status(404).json({code:'SUPPLYGRAPH_ONBOARDING_PACKAGE_NOT_FOUND'});}catch(error){return next(error);}};
const listSellerOnboardingPackages = async(req,res,next)=>{try{return res.json({packages:await authorizedSellerNetworkService.listPackages(req.query),...authorizedSellerSafety});}catch(error){return next(error);}};
const listSellerCoverage = async(_req,res,next)=>{try{return res.json({coverage:authorizedSellerNetworkService.coverage(),...authorizedSellerSafety});}catch(error){return next(error);}};
const getSellerOnboardingPackage=async(req,res,next)=>{try{const row=await authorizedSellerNetworkService.getPackage(req.params.id);return row?res.json({package:row,...authorizedSellerSafety}):res.status(404).json({code:'SUPPLYGRAPH_ONBOARDING_PACKAGE_NOT_FOUND'});}catch(error){return next(error);}};
const cancelSellerOnboardingPackage=async(req,res,next)=>{try{return res.json({package:await authorizedSellerNetworkService.cancel(req.params.id,req.body||{},actorContext(req)),...authorizedSellerSafety});}catch(error){return next(error);}};
const listAuthorizedSellerProfiles=async(req,res,next)=>{try{return res.json({sellers:await authorizedSellerNetworkService.persistedSellers(req.query),...authorizedSellerSafety});}catch(error){return next(error);}};
const getAuthorizedSellerProfile=async(req,res,next)=>{try{const seller=await authorizedSellerNetworkService.persistedSeller(req.params.id);return seller?res.json({seller,...authorizedSellerSafety}):res.status(404).json({code:'SUPPLYGRAPH_AUTHORIZED_SELLER_NOT_FOUND'});}catch(error){return next(error);}};
const listAuthorizedSellerCatalog=async(req,res,next)=>{try{return res.json({items:await authorizedSellerNetworkService.sellerCatalog(req.params.id,req.query),...authorizedSellerSafety});}catch(error){return next(error);}};
const listAuthorizedSellerInventory=async(req,res,next)=>{try{return res.json({inventory:await authorizedSellerNetworkService.inventory({sellerId:req.params.id,...req.query}),...authorizedSellerSafety});}catch(error){return next(error);}};
const listAuthorizedSellerMedia=async(req,res,next)=>{try{return res.json({media:await authorizedSellerNetworkService.media({sellerId:req.params.id,...req.query}),...authorizedSellerSafety});}catch(error){return next(error);}};
const getAuthorizedProduct=async(req,res,next)=>{try{const product=await authorizedSellerNetworkService.product(req.params.id);return product?res.json({product,...authorizedSellerSafety}):res.status(404).json({code:'SUPPLYGRAPH_PRODUCT_NOT_FOUND'});}catch(error){return next(error);}};
const getAuthorizedProductInventory=async(req,res,next)=>{try{return res.json({inventory:await authorizedSellerNetworkService.inventory({productId:req.params.id}),...authorizedSellerSafety});}catch(error){return next(error);}};
const getAuthorizedProductMedia=async(req,res,next)=>{try{return res.json({media:await authorizedSellerNetworkService.media({productId:req.params.id}),...authorizedSellerSafety});}catch(error){return next(error);}};
const getSellerReadiness=async(_req,res,next)=>{try{return res.json({sellers:await authorizedSellerNetworkService.readiness(),...authorizedSellerSafety});}catch(error){return next(error);}};
const getSellerCatalogGaps=async(_req,res,next)=>{try{return res.json({gaps:await authorizedSellerNetworkService.catalogGaps(),...authorizedSellerSafety});}catch(error){return next(error);}};
const getMatchSupplierCoverage=async(req,res,next)=>{try{return res.json({coverage:await authorizedSellerNetworkService.coverageResults({matchRunId:req.params.id}),...authorizedSellerSafety});}catch(error){return next(error);}};
const getDemandSupplierCoverage=async(req,res,next)=>{try{const latest=await supplyGraphMatchStore.latestForDemand(req.params.id);return res.json({matchRunId:latest?.matchRun?.id||null,coverage:latest?.supplierCoverage||[],...authorizedSellerSafety});}catch(error){return next(error);}};
const getWave1Activation=async(_req,res,next)=>{try{return res.json(await authorizedSellerNetworkService.wave1Activation());}catch(error){return next(error);}};
const getSellerCatalogHealth=async(req,res,next)=>{try{const result=await authorizedSellerNetworkService.catalogHealth(req.params.id);return result?res.json(result):res.status(404).json({code:'SUPPLYGRAPH_AUTHORIZED_SELLER_NOT_FOUND'});}catch(error){return next(error);}};
const getWave1CaptureSummary=async(_req,res,next)=>{try{const result=await authorizedSellerNetworkService.wave1Activation();return res.json({status:result.status,sellerCount:result.sellerCount,catalogReadySellerCount:result.sellers.filter((seller)=>seller.catalogReady).length,profileOnlySellerCount:result.sellers.filter((seller)=>!seller.catalogReady).length,productsAccepted:result.sellers.reduce((sum,seller)=>sum+seller.productCount,0),publicPrices:result.sellers.reduce((sum,seller)=>sum+seller.publicPriceCount,0),...authorizedSellerSafety});}catch(error){return next(error);}};
const getSellerMediaCoverage=async(_req,res,next)=>{try{return res.json(await authorizedSellerNetworkService.mediaCoverage());}catch(error){return next(error);}};
const getSellerInventoryInitializationStatus=async(_req,res,next)=>{try{return res.json(await authorizedSellerNetworkService.inventoryInitializationStatus());}catch(error){return next(error);}};
const syncWave1WorkQueue=async(req,res,next)=>{try{return res.json({...await authorizedSellerNetworkService.syncWave1WorkQueue(actorContext(req)),...authorizedSellerSafety});}catch(error){return next(error);}};

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

const includeAcceptanceTest = (req) => String(req.query.includeAcceptanceTest || '') === 'true';
const evidenceSafety = { cornerMexMutations: false, externalActionsBlocked: true, supplierContactAllowed: false, customerContactAllowed: false, executed: false };

const createSupplyGraphEvidencePackage = async (req, res, next) => {
  try {
    const result = await supplierEvidenceService.create(req.body || {}, actorContext(req));
    return res.status(result.reused ? 200 : 201).json({ ...result, ...evidenceSafety });
  } catch (error) { return next(error); }
};
const listSupplyGraphEvidencePackages = async (req, res, next) => {
  try { return res.json({ packages: await supplierEvidenceService.list({ status:req.query.status,supplierId:req.query.supplierId,limit:req.query.limit,offset:req.query.offset,includeAcceptanceTest:includeAcceptanceTest(req) }), ...evidenceSafety }); }
  catch (error) { return next(error); }
};
const getSupplyGraphEvidencePackage = async (req, res, next) => {
  try { const result=await supplierEvidenceService.get(req.params.id,{includeAcceptanceTest:includeAcceptanceTest(req)});return result?res.json({...result,applications:await supplierEvidenceStore.applicationsForPackage(req.params.id),...evidenceSafety}):res.status(404).json({code:'SUPPLYGRAPH_EVIDENCE_PACKAGE_NOT_FOUND',message:'Evidence package not found.'}); }
  catch(error){return next(error);}
};
const previewSupplyGraphEvidencePackage = async (req,res,next)=>{try{const result=await supplierEvidenceService.preview(req.params.id,{includeAcceptanceTest:includeAcceptanceTest(req)});return result?res.json({...result,...evidenceSafety}):res.status(404).json({code:'SUPPLYGRAPH_EVIDENCE_PACKAGE_NOT_FOUND',message:'Evidence package not found.'});}catch(error){return next(error);}};
const applySupplyGraphEvidencePackage = async (req,res,next)=>{try{const result=await supplierEvidenceService.apply(req.params.id,req.body||{},actorContext(req));return result?res.json({...result,...evidenceSafety}):res.status(404).json({code:'SUPPLYGRAPH_EVIDENCE_PACKAGE_NOT_FOUND',message:'Evidence package not found.'});}catch(error){return next(error);}};
const cancelSupplyGraphEvidencePackage = async (req,res,next)=>{try{const result=await supplierEvidenceService.cancel(req.params.id,req.body||{},actorContext(req));return result?res.json({package:result,...evidenceSafety}):res.status(404).json({code:'SUPPLYGRAPH_EVIDENCE_PACKAGE_NOT_FOUND',message:'Evidence package not found.'});}catch(error){return next(error);}};
const getSupplyGraphCatalogEvidence = async(req,res,next)=>{try{const result=await supplierEvidenceService.catalogEvidence(req.params.catalogItemId,{includeAcceptanceTest:includeAcceptanceTest(req)});return result?res.json({...result,...evidenceSafety}):res.status(404).json({code:'SUPPLYGRAPH_CATALOG_ITEM_NOT_FOUND',message:'Catalog item not found.'});}catch(error){return next(error);}};
const getSupplyGraphSupplierEvidenceStatus = async(req,res,next)=>{try{return res.json({...await supplierEvidenceService.supplierStatus(req.params.supplierId),...evidenceSafety});}catch(error){return next(error);}};
const listSupplyGraphEvidenceConflicts = async(_req,res,next)=>{try{return res.json({conflicts:await supplierEvidenceService.conflicts(),...evidenceSafety});}catch(error){return next(error);}};
const listSupplyGraphEvidenceExpiring = async(req,res,next)=>{try{return res.json({facts:await supplierEvidenceService.expiring({hours:req.query.hours}),...evidenceSafety});}catch(error){return next(error);}};

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
  supplierEvidenceService,
  supplierEvidenceStore,
  authorizedSellerNetworkService,
  listAuthorizedSellers,
  getAuthorizedSeller,
  previewSellerOnboarding,
  createSellerOnboardingPackage,
  createSellerOnboardingPackageFromBody,createSellerOnboardingPackageFromSnapshot,
  applySellerOnboardingPackage,
  listSellerOnboardingPackages,
  listSellerCoverage,
  getSellerOnboardingPackage,cancelSellerOnboardingPackage,listAuthorizedSellerProfiles,getAuthorizedSellerProfile,listAuthorizedSellerCatalog,listAuthorizedSellerInventory,listAuthorizedSellerMedia,getAuthorizedProduct,getAuthorizedProductInventory,getAuthorizedProductMedia,getSellerReadiness,getSellerCatalogGaps,getMatchSupplierCoverage,getDemandSupplierCoverage,
  getWave1Activation,getSellerCatalogHealth,getWave1CaptureSummary,getSellerMediaCoverage,getSellerInventoryInitializationStatus,
  syncWave1WorkQueue,
  supplyGraphStatus,
  listSupplyGraphSuppliers,
  getSupplyGraphSupplier,
  listSupplyGraphCatalog,
  createSupplyGraphEvidencePackage,
  listSupplyGraphEvidencePackages,
  getSupplyGraphEvidencePackage,
  previewSupplyGraphEvidencePackage,
  applySupplyGraphEvidencePackage,
  cancelSupplyGraphEvidencePackage,
  getSupplyGraphCatalogEvidence,
  getSupplyGraphSupplierEvidenceStatus,
  listSupplyGraphEvidenceConflicts,
  listSupplyGraphEvidenceExpiring,
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
