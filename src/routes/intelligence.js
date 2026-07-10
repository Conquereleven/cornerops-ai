const express = require('express');
const controller = require('../controllers/intelligenceController');
const { createControlTowerFrontendAuth } = require('../api/middleware/controlTowerFrontendAuth');
const { createControlTowerFrontendCors } = require('../api/middleware/controlTowerFrontendCors');
const { createControlTowerFrontendRateLimit } = require('../api/middleware/controlTowerFrontendRateLimit');
const { createControlTowerFrontendSanitizer } = require('../api/middleware/controlTowerFrontendSanitizer');

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
router.post('/action-engine/drafts', controller.actionEngineDrafts);
router.get('/product-activation', controller.productActivation);
router.get('/environment-doctor', controller.environmentDoctor);
router.get('/clients', controller.clients);
router.get('/signals', controller.signals);
router.get('/anomalies', controller.anomalies);
router.get('/cases', controller.cases);
router.get('/founder-review', controller.founderReview);
router.post('/cases/from-anomaly', controller.createCaseFromAnomaly);
router.patch('/cases/:id/status', controller.updateCaseStatus);
router.get('/playbooks', controller.playbooks);
router.get('/connectors', controller.connectors);

module.exports = router;
