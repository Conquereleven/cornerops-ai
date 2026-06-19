const express = require('express');
const controller = require('../controllers/controlTowerController');
const env = require('../config/env');
const internalAuth = require('../middleware/internalAuth');

const router = express.Router();

if (env.corneropsControlTowerRequireAuth) router.use(internalAuth);
router.get('/status', controller.status);
router.get('/beta', controller.beta);
router.get('/data-contracts', controller.dataContracts);
router.get('/schema-discovery', controller.schemaDiscovery);
router.get('/security', controller.security);
router.get('/approvals', controller.approvals);
router.get('/audit-summary', controller.auditSummary);

module.exports = router;
