const express = require('express');
const { chat } = require('../controllers/chatController');
const { validateChatPayload } = require('../utils/validateChatPayload');
const { guard } = require('../middleware/appAuth');

const router = express.Router();

const validateChatRequest = (req, res, next) => {
  const errors = validateChatPayload(req.body);
  if (errors.length) {
    return res.status(400).json({
      error: true,
      message: errors.join(' '),
    });
  }

  return next();
};

// Internal operator chat: workspace session with an operator role.
router.post('/', ...guard('internal_write'), validateChatRequest, chat);

module.exports = router;
