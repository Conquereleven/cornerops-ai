const express = require('express');
const controller = require('../controllers/intelligenceController');
const { createControlTowerFrontendAuth } = require('../api/middleware/controlTowerFrontendAuth');
const { createControlTowerFrontendCors } = require('../api/middleware/controlTowerFrontendCors');
const { createControlTowerFrontendRateLimit } = require('../api/middleware/controlTowerFrontendRateLimit');
const { createControlTowerFrontendSanitizer } = require('../api/middleware/controlTowerFrontendSanitizer');
const { createControlTowerFounderActionAuth } = require('../api/middleware/controlTowerFounderActionAuth');

const router = express.Router();

router.use(
  createControlTowerFrontendCors(),
  createControlTowerFrontendAuth(),
  createControlTowerFrontendRateLimit(),
  createControlTowerFrontendSanitizer(),
);

router.get('/overview', controller.overview);
router.get('/control-tower-status', controller.controlTowerStatus);
router.get('/action-engine', controller.actionEngine);
const founderActionAuth = createControlTowerFounderActionAuth({
  recordAudit: controller.recordFounderActionAuthFailure,
});
router.post('/action-engine/drafts', founderActionAuth, controller.actionEngineDrafts);
router.get('/work-queue/status', controller.workQueueStatus);
router.get('/work-queue/audit', controller.listPersistentAudit);
router.get('/work-queue/drafts', controller.listPersistentDrafts);
router.get('/work-queue', controller.listWorkQueue);
router.get('/work-queue/:id', controller.getWorkItem);
router.post('/work-queue/sync', founderActionAuth, controller.syncWorkQueue);
router.patch('/work-queue/:id', founderActionAuth, controller.updateWorkItem);
router.get('/approvals', controller.listPersistentApprovals);
router.get('/approvals/:id', controller.getPersistentApproval);
router.post('/approvals/:id/approve', founderActionAuth, controller.approvePersistentApproval);
router.post('/approvals/:id/reject', founderActionAuth, controller.rejectPersistentApproval);
router.post('/approvals/:id/cancel', founderActionAuth, controller.cancelPersistentApproval);
router.get('/supplygraph/status', controller.supplyGraphStatus);
router.get('/supplygraph/suppliers', controller.listSupplyGraphSuppliers);
router.get('/supplygraph/suppliers/:id', controller.getSupplyGraphSupplier);
router.get('/supplygraph/catalog', controller.listSupplyGraphCatalog);
router.get('/supplygraph/demand-requests', controller.listSupplyGraphDemands);
router.get('/supplygraph/demand-requests/:id', controller.getSupplyGraphDemand);
router.get('/supplygraph/demand-requests/:id/match-runs', controller.listSupplyGraphDemandMatchRuns);
router.get('/supplygraph/demand-requests/:id/latest-match', controller.latestSupplyGraphDemandMatch);
router.get('/supplygraph/match-runs', controller.listSupplyGraphMatchRuns);
router.get('/supplygraph/match-runs/:id', controller.getSupplyGraphMatchRun);
router.post('/supplygraph/intermex/sync', founderActionAuth, controller.syncSupplyGraphIntermex);
router.post('/supplygraph/demand-requests', founderActionAuth, controller.createSupplyGraphDemand);
router.post('/supplygraph/demand-requests/:id/match', founderActionAuth, controller.matchSupplyGraphDemand);
router.patch('/supplygraph/demand-requests/:id', founderActionAuth, controller.updateSupplyGraphDemand);
router.get('/product-activation', controller.productActivation);
router.get('/environment-doctor', controller.environmentDoctor);
router.get('/clients', controller.clients);
router.get('/signals', controller.signals);
router.get('/anomalies', controller.anomalies);
router.get('/cases', controller.cases);
router.get('/founder-review', controller.founderReview);
router.post('/cases/from-anomaly', founderActionAuth, controller.createCaseFromAnomaly);
router.patch('/cases/:id/status', founderActionAuth, controller.updateCaseStatus);
router.get('/playbooks', controller.playbooks);
router.get('/connectors', controller.connectors);

module.exports = router;
