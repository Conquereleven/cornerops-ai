const express = require('express');
const controller = require('../controllers/dataController');
const internalApiKey = require('../middleware/internalApiKey');

const router = express.Router();

router.use(internalApiKey);
router.get('/conversations', controller.listConversations);
router.get('/conversations/:id', controller.getConversation);
router.get('/leads', controller.listLeads);
router.post('/leads', controller.createLead);
router.patch('/leads/:leadId/status', controller.updateLeadStatus);
router.get('/products', controller.listProducts);
router.get('/orders', controller.listOrders);

module.exports = router;
