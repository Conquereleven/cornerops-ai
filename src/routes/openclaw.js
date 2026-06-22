const express = require('express');
const controller = require('../controllers/openclawController');
const internalAuth = require('../middleware/internalAuth');

const router = express.Router();

router.use(internalAuth);
router.get('/health', controller.health);
router.post('/messages', controller.receiveMessage);
router.get('/approvals', controller.listApprovals);
router.post('/approvals', controller.createApproval);
router.get('/approvals/:id', controller.getApproval);
router.post('/approvals/:id/approve', controller.approve);
router.post('/approvals/:id/reject', controller.reject);
router.get('/audit-logs', controller.listAuditLogs);

module.exports = router;
