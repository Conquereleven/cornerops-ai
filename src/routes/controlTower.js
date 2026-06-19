const express = require('express');
const controller = require('../controllers/controlTowerController');
const internalAuth = require('../middleware/internalAuth');

const router = express.Router();

router.use(internalAuth);
router.get('/status', controller.status);
router.get('/security', controller.security);
router.get('/approvals', controller.approvals);
router.get('/audit-summary', controller.auditSummary);

module.exports = router;
