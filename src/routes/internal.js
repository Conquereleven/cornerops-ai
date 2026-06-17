const express = require('express');
const controller = require('../controllers/dataController');
const internalAuth = require('../middleware/internalAuth');

const router = express.Router();

router.use(internalAuth);
router.get('/conversations', controller.listConversations);
router.get('/conversations/:id', controller.getConversation);
router.get('/leads', controller.listLeads);
router.post('/leads', controller.createLead);
router.patch('/leads/:leadId/status', controller.updateLeadStatus);
router.post('/leads/:leadId/notes', controller.addLeadNote);
router.get('/products/search', controller.listProducts);
router.get('/products', controller.listProducts);
router.post('/products/sync-mocks', controller.syncProducts);
router.get('/orders', controller.listOrders);
router.get('/orders/:orderNumber', controller.getOrder);
router.get('/customers', controller.listCustomers);
router.post('/customers', controller.createCustomer);
router.get('/worker-events', controller.listInternalWorkerEvents);

module.exports = router;
