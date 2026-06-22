const express = require('express');
const controller = require('../controllers/controlTowerController');
const env = require('../config/env');
const internalAuth = require('../middleware/internalAuth');
const { createWebConsoleGuard } = require('../middleware/webConsoleGuard');

const router = express.Router();

if (env.corneropsControlTowerRequireAuth) router.use(internalAuth);
router.get('/status', controller.status);
router.get('/beta', controller.beta);
router.get('/data-contracts', controller.dataContracts);
router.get('/schema-discovery', controller.schemaDiscovery);
router.get('/security', controller.security);
router.get('/approvals', controller.approvals);
router.get('/audit-summary', controller.auditSummary);
router.use('/v0.8', createWebConsoleGuard());
router.get('/v0.8/status', controller.v08);
router.get('/v0.8/agents', controller.agentsV08);
router.get('/v0.8/data-sources', controller.dataSourcesV08);
router.get('/v0.8/context-sources', controller.contextSourcesV08);
router.get('/v0.8/telegram', controller.telegramV08);
router.get('/v0.8/first-real-source', controller.firstRealSourceV08);
router.get('/v0.8/security', controller.securityV08);
router.get('/v0.8/audit-summary', controller.auditEvents);
router.get('/v0.8/approvals', controller.approvalList);
router.post('/v0.8/approvals/:id/approve-dry-run', controller.approveDryRun);
router.post('/v0.8/approvals/:id/reject-dry-run', controller.rejectDryRun);
router.get('/v0.8/rejections', controller.rejections);
router.get('/v0.8/replay', controller.replay);
router.get('/v0.8/rate-limits', controller.rateLimits);

module.exports = router;
