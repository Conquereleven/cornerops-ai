const express = require('express');
const { ivr } = require('../controllers/ivrController');

const router = express.Router();

const validateIvrRequest = (req, res, next) => {
  const { callId, transcript } = req.body || {};

  if (
    typeof callId !== 'string' ||
    !callId.trim() ||
    typeof transcript !== 'string' ||
    !transcript.trim()
  ) {
    return res.status(400).json({
      error: 'Los campos callId y transcript son obligatorios y deben ser texto.',
    });
  }

  return next();
};

router.post('/', validateIvrRequest, ivr);

module.exports = router;
