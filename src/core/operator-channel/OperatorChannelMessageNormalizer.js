const { randomUUID } = require('crypto');
const { sanitizeMessage, sanitizeValue } = require('../security/SecuritySanitizer');
const { OPERATOR_CHANNEL_PROVIDERS } = require('./operatorChannelTypes');

class OperatorChannelMessageNormalizer {
  normalize(input = {}) {
    const provider = String(input.provider || '').toLowerCase();
    if (!OPERATOR_CHANNEL_PROVIDERS.includes(provider)) {
      const error = new Error('Unsupported operator channel provider.');
      error.code = 'OPERATOR_CHANNEL_PROVIDER_DENIED';
      throw error;
    }
    const text = String(input.text || '').trim();
    if (!text) {
      const error = new Error('Operator channel text is required.');
      error.code = 'OPERATOR_CHANNEL_TEXT_REQUIRED';
      throw error;
    }
    return {
      id: sanitizeMessage(String(input.id || `operator-channel-${randomUUID().slice(0, 12)}`)),
      provider,
      channelId: input.channelId ? sanitizeMessage(String(input.channelId)) : undefined,
      chatId: input.chatId ? sanitizeMessage(String(input.chatId)) : undefined,
      userId: input.userId ? sanitizeMessage(String(input.userId)) : undefined,
      username: input.username ? sanitizeMessage(String(input.username)) : undefined,
      text,
      receivedAt: input.receivedAt || new Date().toISOString(),
      metadata: sanitizeValue(input.metadata || {}, { redactPrivateContent: true }),
    };
  }
}

module.exports = { OperatorChannelMessageNormalizer };
