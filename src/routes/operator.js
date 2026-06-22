const express = require('express');
const env = require('../config/env');
const controller = require('../controllers/operatorController');
const data = require('../core/data');
const internalAuth = require('../middleware/internalAuth');
const { createWebConsoleGuard } = require('../middleware/webConsoleGuard');

const router = express.Router();

router.post('/v0.8/ask', createWebConsoleGuard(), controller.askV08);

router.use(async (req, res, next) => {
  if (env.corneropsApiEnabled) return next();
  const audit = await data.auditLogService.record({
    requestId: req.get('x-request-id'),
    eventType: 'operator_api_denied',
    dataSource: 'operator_interface',
    operation: `${req.method} ${req.path}`,
    userId: 'unknown',
    channel: 'api',
    policyDecision: 'denied',
    status: 'denied',
    input: { path: req.path },
  });
  return res.status(404).json({ error: true, message: 'Operator API is disabled.', auditId: audit?.id });
});
router.use(internalAuth);
router.post('/ask', controller.ask);
router.get('/help', controller.help);
router.get('/status', controller.status);
router.get('/approvals', controller.approvals);
router.get('/audit-summary', controller.auditSummary);
router.get('/sessions/:id', controller.session);

module.exports = router;
