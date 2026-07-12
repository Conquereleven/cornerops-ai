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
