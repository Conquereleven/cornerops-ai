class OperatorChannelRouter {
  constructor({ operatorCommandRouter } = {}) {
    this.operatorCommandRouter = operatorCommandRouter;
  }

  route(message) {
    return this.operatorCommandRouter.handle({
      requestId: message.id,
      operatorId: message.userId,
      channel: 'api',
      text: message.text,
      metadata: {
        operatorChannelProvider: message.provider,
        operatorChannelId: message.channelId,
        operatorChatId: message.chatId,
      },
    });
  }
}

module.exports = { OperatorChannelRouter };
