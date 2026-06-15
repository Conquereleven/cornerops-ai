process.env.NODE_ENV = 'test';

const { handleMessage } = require('../src/services/agent');
const conversationRepository = require('../src/data/repositories/conversationRepository');

describe('CornerOps agent orchestrator', () => {
  test.each([
    [
      '¿Dónde está mi pedido #123?',
      'ordersWorker',
      'order_status',
    ],
    [
      'Busco una cotización de mayoreo para mi restaurante',
      'b2bWorker',
      'b2b_lead',
    ],
    [
      '¿Qué productos tienen disponibles?',
      'salesWorker',
      'product_search',
    ],
    [
      'Quiero hablar con alguien',
      'humanHandoffWorker',
      'human_handoff',
    ],
    [
      'Hola, necesito ayuda',
      'supportWorker',
      'support',
    ],
  ])(
    'routes "%s" to %s',
    async (message, expectedWorker, expectedIntent) => {
      const result = await handleMessage('user-1', message);

      expect(result.reply).toEqual(expect.any(String));
      expect(result.worker).toBe(expectedWorker);
      expect(result.intent).toBe(expectedIntent);
    },
  );

  test('sanitizes long messages before processing', async () => {
    const result = await handleMessage('user-1', `  ${'hola '.repeat(500)}  `);

    expect(result.worker).toBe('supportWorker');
  });

  test('works without an OpenAI API key', async () => {
    delete process.env.OPENAI_API_KEY;
    const result = await handleMessage('1', '¿Tienen Tajín disponible?');
    expect(result.reply).toContain('12 AED');
  });

  test('persists the conversation summary after a worker responds', async () => {
    const result = await handleMessage(
      `agent-persistence-${Date.now()}`,
      '¿Cuál es el estado de mi orden #123?',
    );
    const conversation = await conversationRepository.getConversationById(
      result.conversationId,
    );
    expect(conversation.worker).toBe('ordersWorker');
    expect(conversation.intent).toBe('order_status');
    expect(conversation.lastMessage).toBe(result.reply);
    expect(conversation.messages).toHaveLength(2);
  });
});
