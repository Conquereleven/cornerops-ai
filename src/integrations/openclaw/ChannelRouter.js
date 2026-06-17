const { randomUUID } = require('crypto');
const { CHANNELS } = require('./types');
const { OpenClawPolicyError } = require('./errors');

const aliases = Object.freeze({
  whatsapp: 'whatsapp',
  telegram: 'telegram',
  slack: 'slack',
});

class ChannelRouter {
  constructor({ config }) {
    this.config = config;
  }

  route(payload = {}) {
    const channel = aliases[String(payload.channel || '').toLowerCase()]
      || this.detectChannel(payload);
    if (!CHANNELS.includes(channel)) {
      throw new OpenClawPolicyError('Unsupported OpenClaw channel.', {
        decision: 'denied',
      });
    }
    if (!this.config.allowedChannels.includes(channel)) {
      throw new OpenClawPolicyError(`Channel ${channel} is not enabled.`, {
        decision: 'denied',
      });
    }
    const userId = String(
      payload.userId || payload.from || payload.sender || payload.slackUserId || '',
    ).trim();
    if (!userId) {
      const error = new Error('userId or sender is required.');
      error.statusCode = 400;
      throw error;
    }
    if (
      this.config.allowedUsers.length &&
      !this.config.allowedUsers.includes(userId)
    ) {
      throw new OpenClawPolicyError('Sender is not authorized for OpenClaw.', {
        decision: 'denied',
      });
    }
    const text = String(payload.text || payload.message || '').trim();
    if (!text) {
      const error = new Error('text is required.');
      error.statusCode = 400;
      throw error;
    }
    return {
      messageId: payload.messageId || payload.requestId || `msg-${randomUUID().slice(0, 12)}`,
      requestId: payload.requestId || `request-${randomUUID().slice(0, 12)}`,
      correlationId: payload.correlationId,
      conversationId:
        payload.conversationId || `${channel}-${userId}`.replace(/\s+/g, '-'),
      userId,
      channel,
      channelId: payload.channelId || payload.chatId || payload.threadTs || '',
      text,
      actionType: payload.actionType || 'summarize',
      toolName: payload.toolName,
      userRole: payload.userRole || 'operator',
      businessContext: {
        company: 'CornerMex',
        workspace: 'cornerops',
        ...(payload.businessContext || {}),
      },
      metadata: {
        source: 'cornerops-ai',
        ...(payload.metadata || {}),
      },
      receivedAt: new Date().toISOString(),
    };
  }

  detectChannel(payload) {
    if (payload.phoneNumberId || payload.whatsappMessageId) return 'whatsapp';
    if (payload.telegramChatId) return 'telegram';
    if (payload.slackTeamId || payload.threadTs) return 'slack';
    return '';
  }
}

module.exports = {
  ChannelRouter,
};
