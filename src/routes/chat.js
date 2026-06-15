const express = require('express');
const { chat } = require('../controllers/chatController');
const { validateChatPayload } = require('../utils/validateChatPayload');

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

router.post('/', validateChatRequest, chat);

module.exports = router;
