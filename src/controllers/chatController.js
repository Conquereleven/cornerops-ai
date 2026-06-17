const { handleMessage } = require('../services/agent');

const chat = async (req, res, next) => {
  try {
    const { userId, message, conversationId, requestId, channel } = req.body;
    const result = await handleMessage(userId, message, conversationId, {
      requestId,
      channel,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  chat,
};
