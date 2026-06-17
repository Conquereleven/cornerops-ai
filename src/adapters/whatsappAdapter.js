const normalizeText = (value) =>
  typeof value === 'string' ? value.trim() : '';

const parseIncomingMessage = (payload = {}) => {
  if (payload.from && payload.text) {
    return {
      userId: String(payload.from),
      message: normalizeText(payload.text),
      conversationId: payload.conversationId,
      requestId: payload.requestId,
      channel: 'whatsapp',
    };
  }

  const value = payload.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  const text = message?.text?.body;
  if (!message?.from || !text) return null;

  return {
    userId: String(message.from),
    message: normalizeText(text),
    requestId: message.id,
    channel: 'whatsapp',
  };
};

const formatOutgoingMessage = (chatResponse) => ({
  messaging_product: 'whatsapp',
  type: 'text',
  text: { body: chatResponse.reply },
  metadata: {
    conversationId: chatResponse.conversationId,
    worker: chatResponse.worker,
    intent: chatResponse.intent,
  },
});

module.exports = {
  formatOutgoingMessage,
  parseIncomingMessage,
};
