const express = require('express');
const controller = require('../controllers/dataController');

const router = express.Router();

router.get('/orders', controller.listOrders);
router.get('/mock/orders', controller.listOrders);
router.get('/orders/:orderNumber', controller.getOrder);
router.get('/products/search', controller.listProducts);
router.get('/products', controller.listProducts);
router.get('/mock/products', controller.listProducts);
router.get('/products/:sku', controller.getProduct);
router.get('/leads', controller.listLeads);
router.get('/mock/leads', controller.listLeads);
router.get('/leads/:id', controller.getLead);
router.patch('/leads/:id', controller.updateLead);
router.get('/conversations', controller.listConversations);
router.get('/conversations/:id/messages', controller.listConversationMessages);
router.get('/conversations/:id', controller.getConversation);
router.get('/worker-runs', controller.listWorkerRuns);
router.get('/dashboard', controller.getDashboard);
router.get('/workers', controller.listWorkers);
router.patch('/workers/:id', controller.updateWorker);
router.get('/events', controller.listEvents);
router.get('/handoffs', controller.listHandoffs);
router.patch('/handoffs/:id', controller.updateHandoff);
router.get('/integrations', controller.listIntegrations);
router.patch('/integrations/:id', controller.updateIntegration);
router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);

module.exports = router;
