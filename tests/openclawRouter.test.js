process.env.NODE_ENV = 'test';

const { ChannelRouter } = require('../src/integrations/openclaw/ChannelRouter');

const config = {
  allowedChannels: ['whatsapp', 'telegram', 'slack'],
  allowedUsers: [],
};

describe('ChannelRouter', () => {
  test('normalizes WhatsApp, Telegram and Slack payloads', () => {
    const router = new ChannelRouter({ config });

    expect(router.route({
      channel: 'whatsapp',
      from: 'buyer-1',
      text: 'Hola',
    }).channel).toBe('whatsapp');
    expect(router.route({
      channel: 'telegram',
      userId: 'buyer-2',
      message: 'Hola',
    }).channel).toBe('telegram');
    expect(router.route({
      channel: 'slack',
      slackUserId: 'U123',
      text: 'Hola',
    }).userId).toBe('U123');
  });

  test('rejects disabled channels and unauthorized senders', () => {
    expect(() => new ChannelRouter({
      config: { allowedChannels: ['slack'], allowedUsers: [] },
    }).route({
      channel: 'whatsapp',
      from: 'buyer-1',
      text: 'Hola',
    })).toThrow(/not enabled/);

    expect(() => new ChannelRouter({
      config: {
        allowedChannels: ['slack'],
        allowedUsers: ['U1'],
      },
    }).route({
      channel: 'slack',
      slackUserId: 'U2',
      text: 'Hola',
    })).toThrow(/not authorized/);
  });
});
