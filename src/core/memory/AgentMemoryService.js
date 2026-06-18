class AgentMemoryService {
  constructor() {
    this.messagesByConversation = new Map();
  }

  remember(input, output) {
    const conversationId = input.conversationId || 'unknown';
    const history = this.messagesByConversation.get(conversationId) || [];
    history.unshift({
      input: {
        messageId: input.messageId,
        userId: input.userId,
        channel: input.channel,
        text: input.text,
      },
      output: {
        agentId: output.agentId,
        status: output.status,
        responseText: output.responseText,
      },
      createdAt: new Date().toISOString(),
    });
    this.messagesByConversation.set(conversationId, history.slice(0, 50));
  }

  getConversation(conversationId) {
    return [...(this.messagesByConversation.get(conversationId) || [])];
  }

  clearForTests() {
    this.messagesByConversation.clear();
  }
}

module.exports = {
  AgentMemoryService,
};
