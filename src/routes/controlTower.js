const express = require('express');
const controller = require('../controllers/controlTowerController');
const env = require('../config/env');
const internalAuth = require('../middleware/internalAuth');
const { createWebConsoleGuard } = require('../middleware/webConsoleGuard');
const { createControlTowerFrontendAuth } = require('../api/middleware/controlTowerFrontendAuth');
const { createControlTowerFrontendCors } = require('../api/middleware/controlTowerFrontendCors');
const { createControlTowerFrontendRateLimit } = require('../api/middleware/controlTowerFrontendRateLimit');
const { createControlTowerFrontendSanitizer } = require('../api/middleware/controlTowerFrontendSanitizer');

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
router.use('/v0.9', createWebConsoleGuard());
router.get('/v0.9/status', controller.v09);
router.get('/v0.9/approvals', controller.approvalList);
router.get('/v0.9/audit-summary', controller.auditEvents);
router.use('/v1.0', createWebConsoleGuard());
router.get('/v1.0/status', controller.v10);
router.get('/v1.0/approvals', controller.approvalList);
router.get('/v1.0/audit-summary', controller.auditEvents);
router.use('/v1.1', createWebConsoleGuard());
router.get('/v1.1/status', controller.v11);
router.get('/v1.1/approvals', controller.approvalList);
router.get('/v1.1/audit-summary', controller.auditEvents);
router.use(
  '/frontend/v1',
  createControlTowerFrontendCors(),
  createControlTowerFrontendAuth(),
  createControlTowerFrontendRateLimit(),
  createControlTowerFrontendSanitizer(),
);
router.get('/frontend/v1', controller.frontendAll);
router.get('/frontend/v1/connection-test', controller.frontendConnectionTest);
router.get('/frontend/v1/status', controller.frontendStatus);
router.get('/frontend/v1/founder-daily', controller.frontendFounderDaily);
router.get('/frontend/v1/cornermex', controller.frontendCornerMex);
router.get('/frontend/v1/flows', controller.frontendFlows);
router.get('/frontend/v1/approvals', controller.frontendApprovals);
router.get('/frontend/v1/audit', controller.frontendAudit);
router.get('/frontend/v1/security', controller.frontendSecurity);
router.get('/frontend/v1/telegram', controller.frontendTelegram);
router.get('/frontend/v1/drafts', controller.frontendDrafts);
router.get('/frontend/v1/actions', controller.frontendActions);

module.exports = router;
