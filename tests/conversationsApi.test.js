process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('Conversations API', () => {
  test('lists a conversation and its messages after chat', async () => {
    const chat = await request(app).post('/api/chat').send({
      userId: `api-conversation-${Date.now()}`,
      message: 'Hola, necesito ayuda',
    });
    const detail = await request(app).get(`/api/conversations/${chat.body.conversationId}`);
    const messages = await request(app).get(`/api/conversations/${chat.body.conversationId}/messages`);
    const list = await request(app).get('/api/conversations?worker=supportWorker&intent=support');

    expect(detail.statusCode).toBe(200);
    expect(detail.body.lastMessage).toBe(chat.body.reply);
    expect(messages.body).toHaveLength(2);
    expect(list.body.some((item) => item.id === chat.body.conversationId)).toBe(true);
  });
});
