process.env.NODE_ENV = 'test';

const repository = require('../src/data/repositories/conversationRepository');

describe('conversationRepository', () => {
  test('creates, updates, lists, and returns conversation messages', async () => {
    const userId = `conversation-user-${Date.now()}`;
    const conversation = await repository.createConversation(userId);
    await repository.addMessage({
      conversationId: conversation.id,
      userId,
      role: 'user',
      content: 'Necesito ayuda',
      intent: 'support',
      worker: 'supportWorker',
    });
    await repository.addMessage({
      conversationId: conversation.id,
      userId,
      role: 'assistant',
      content: 'Claro, te ayudo.',
      intent: 'support',
      worker: 'supportWorker',
      metadata: { requiresHuman: false },
    });
    await repository.updateConversation(conversation.id, {
      mainWorker: 'supportWorker',
      mainIntent: 'support',
      lastMessage: 'Claro, te ayudo.',
      requiresHuman: false,
    });

    const stored = await repository.getConversationById(conversation.id);
    const list = await repository.listConversations({
      worker: 'supportWorker',
      intent: 'support',
    });
    const history = await repository.getConversationHistory(userId, 10);

    expect(stored.messages).toHaveLength(2);
    expect(stored.lastMessage).toBe('Claro, te ayudo.');
    expect(list.some((item) => item.id === conversation.id)).toBe(true);
    expect(history.map((message) => message.role)).toEqual(['user', 'assistant']);
  });
});
