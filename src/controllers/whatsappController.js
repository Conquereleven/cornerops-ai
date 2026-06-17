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
  receiveWebhook,
  verifyWebhook,
};
