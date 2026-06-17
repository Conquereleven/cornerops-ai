class MemoryBridge {
  toOpenClawSession({ conversationId, userId, channel, metadata = {} }) {
    return {
      sessionId: conversationId,
      userId,
      channel,
      source: 'cornerops-ai',
      metadata: {
        memoryOwner: 'cornerops-ai',
        ...metadata,
      },
    };
  }

  fromOpenClawSession(session = {}) {
    return {
      conversationId: session.sessionId || session.conversationId,
      userId: session.userId,
      channel: session.channel,
      metadata: session.metadata || {},
    };
  }
}

module.exports = {
  MemoryBridge,
};
