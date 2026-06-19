class MockOperatorChannelAdapter {
  constructor({ dryRun = true } = {}) {
    this.provider = 'mock';
    this.dryRun = dryRun;
    this.replies = [];
    this.channelService = null;
  }

  connect(channelService) {
    this.channelService = channelService;
    return this;
  }

  simulateInbound(message) {
    if (!this.channelService) throw new Error('Mock operator channel is not connected.');
    return this.channelService.handleInbound({ provider: this.provider, ...message });
  }

  async sendReply(response) {
    const result = {
      ...response,
      status: this.dryRun || response.dryRun ? 'dry_run' : 'sent',
      warnings: this.dryRun || response.dryRun ? ['Mock reply was not sent externally.'] : [],
    };
    this.replies.push(result);
    return result;
  }

  clearForTests() {
    this.replies.splice(0);
  }
}

module.exports = { MockOperatorChannelAdapter };
