const express = require('express');
const {
  receiveWebhook,
  verifyWebhook,
} = require('../controllers/whatsappController');

const router = express.Router();

router.get('/', verifyWebhook);
router.post('/', receiveWebhook);

module.exports = router;
