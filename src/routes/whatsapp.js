const express = require('express');
const {
  receiveWebhook,
  verifyWebhook,
  verifyWebhookSignature,
} = require('../controllers/whatsappController');

const router = express.Router();

router.get('/', verifyWebhook);
router.post('/', verifyWebhookSignature, receiveWebhook);

module.exports = router;
