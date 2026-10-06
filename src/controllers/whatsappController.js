const { createHmac, timingSafeEqual } = require('crypto');
const env = require('../config/env');
const { handleMessage } = require('../services/agent');
const {
  formatOutgoingMessage,
  parseIncomingMessage,
} = require('../adapters/whatsappAdapter');

const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    env.whatsappVerifyToken &&
    mode === 'subscribe' &&
    token === env.whatsappVerifyToken
  ) {
    return res.status(200).send(challenge);
  }

  if (!env.whatsappVerifyToken) {
    return res.status(200).json({
      status: 'placeholder',
      configured: false,
    });
  }

  return res.status(403).json({ error: true, message: 'Verification failed.' });
};

// Meta signs the raw body with the app secret. Without a configured secret or a
// matching signature the message is never processed.
const createWebhookSignatureVerifier = (config = env) => (req, res, next) => {
  if (!config.whatsappWebhookSecret) {
    return res.status(503).json({ error: true, code: 'WHATSAPP_WEBHOOK_NOT_CONFIGURED', message: 'WhatsApp webhook verification is not configured.' });
  }
  const provided = Buffer.from(String(req.get('x-hub-signature-256') || ''));
  const expected = Buffer.from(`sha256=${createHmac('sha256', config.whatsappWebhookSecret).update(req.rawBody || Buffer.alloc(0)).digest('hex')}`);
  if (!req.rawBody || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return res.status(401).json({ error: true, code: 'WHATSAPP_WEBHOOK_SIGNATURE_INVALID', message: 'Invalid webhook signature.' });
  }
  return next();
};
const verifyWebhookSignature = createWebhookSignatureVerifier();

const receiveWebhook = async (req, res, next) => {
  try {
    const incoming = parseIncomingMessage(req.body);
    if (!incoming?.message) {
      return res.status(202).json({ accepted: true, ignored: true });
    }
    const result = await handleMessage(
      incoming.userId,
      incoming.message,
      incoming.conversationId,
      {
        requestId: incoming.requestId,
        channel: incoming.channel,
      },
    );
    return res.status(200).json({
      accepted: true,
      outgoing: formatOutgoingMessage(result),
      result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createWebhookSignatureVerifier,
  verifyWebhookSignature,
  receiveWebhook,
  verifyWebhook,
};
