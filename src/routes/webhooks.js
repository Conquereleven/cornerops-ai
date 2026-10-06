const express = require('express');
const { receiveGitHubWebhook } = require('../controllers/dataController');
const whatsappRoutes = require('./whatsapp');

// Provider callbacks. Each is authenticated by the provider's own signature,
// never by a user session.
const router = express.Router();
router.use('/whatsapp', whatsappRoutes);
router.post('/github', receiveGitHubWebhook);

module.exports = { router, receiveGitHubWebhook };
