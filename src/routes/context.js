const express = require('express');
const controller = require('../controllers/contextController');

const router = express.Router();

router.get('/context/search', controller.searchContext);
router.get('/context/sources', controller.listSources);
router.get('/context/sources/:id', controller.getSource);
router.get('/context/health', controller.getHealth);
router.post('/context/sources/:id/enable-request', controller.sourceEnableRequest);
router.post('/context/sources/:id/sync-request', controller.sourceSyncRequest);
router.post('/context/retention-change-request', controller.retentionChangeRequest);
router.get('/local-archives/records', controller.listRecords);
router.get('/local-archives/records/:id', controller.getRecord);
router.get('/crawlers', controller.listCrawlers);
router.get('/crawlers/:id/health', controller.getCrawlerHealth);
router.get('/native-tools', controller.listNativeTools);
router.post('/native-tools/:id/enable-request', controller.nativeToolEnableRequest);
router.get('/sdk/plugin-inspector/reports', controller.listPluginInspectorReports);
router.post('/sdk/plugin-inspector/review-request', controller.pluginReviewRequest);
router.get('/sdk/clawbench/reports', controller.listClawbenchReports);
router.post('/sdk/clawbench/run-request', controller.clawbenchRunRequest);

module.exports = router;
