class OpenClawOperatorChannelBridge {
  constructor({ config = {} } = {}) {
    this.provider = 'openclaw';
    this.config = config;
    this.channelService = null;
  }

  connect(channelService) {
    this.channelService = channelService;
    return this;
  }

  async handleMessage(payload = {}) {
    if (!this.channelService) throw new Error('OpenClaw operator bridge is not connected.');
    const metadata = payload.metadata || {};
    const userId = payload.userId || metadata.userId;
    const destination = payload.chatId || payload.channelId || metadata.chatId || metadata.channelId;
    if (!payload.id || !payload.text || !userId || !destination) {
      return this.channelService.failClosed({
        id: payload.id,
        provider: this.provider,
        text: payload.text,
        userId,
        channelId: destination,
      }, 'OPENCLAW_OPERATOR_METADATA_REQUIRED');
    }
    return this.channelService.handleInbound({
      id: payload.id,
      provider: this.provider,
      channelId: payload.channelId || metadata.channelId || destination,
      chatId: payload.chatId || metadata.chatId,
      userId,
      username: payload.username || metadata.username,
      text: payload.text,
      receivedAt: payload.receivedAt,
      metadata: {
        sourceProvider: metadata.sourceProvider,
        gatewayRequestId: metadata.requestId,
      },
    });
  }

  async sendReply(response) {
    return {
      status: 'dry_run',
      warnings: [
        this.config.enabled
          ? 'OpenClaw operator reply remains dry-run in v0.6.'
          : 'OpenClaw operator bridge is disabled; no reply was sent.',
      ],
      response,
    };
  }
}

module.exports = { OpenClawOperatorChannelBridge };
