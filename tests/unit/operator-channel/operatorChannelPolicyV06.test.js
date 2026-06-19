const { OperatorChannelPolicy } = require('../../../src/core/operator-channel/OperatorChannelPolicy');

const config = (overrides = {}) => ({
  enabled: true,
  provider: 'mock',
  mode: 'read_only',
  dryRun: true,
  requireApproval: true,
  allowedUserIds: ['founder'],
  allowedChannelIds: [],
  allowedChatIds: ['founder-chat'],
  replyEnabled: true,
  replyDryRun: true,
  rejectUnknownSenders: true,
  requireAllowlist: true,
  maxMessageChars: 12000,
  piiMasking: true,
  logSanitization: true,
  failClosed: true,
  requireAudit: true,
  requireApprovalForExternalActions: true,
  requireApprovalForWrites: true,
  ...overrides,
});

const message = (overrides = {}) => ({
  provider: 'mock',
  userId: 'founder',
  chatId: 'founder-chat',
  text: 'help',
  ...overrides,
});

describe('OperatorChannelPolicy v0.6', () => {
  test('allows an approved mock sender in safe mode', () => {
    expect(new OperatorChannelPolicy(config()).evaluate(message())).toMatchObject({
      allowed: true,
      replyAllowed: true,
      dryRun: true,
    });
  });

  test.each([
    ['unknown sender', message({ userId: 'unknown' }), 'OPERATOR_CHANNEL_UNKNOWN_SENDER'],
    ['unknown destination', message({ chatId: 'other-chat' }), 'OPERATOR_CHANNEL_UNKNOWN_DESTINATION'],
    ['oversized message', message({ text: 'x'.repeat(12001) }), 'OPERATOR_CHANNEL_MESSAGE_TOO_LONG'],
    ['external send', message({ text: 'Send this message to Jaime' }), 'OPERATOR_CHANNEL_EXTERNAL_SEND_BLOCKED'],
    ['write request', message({ text: 'Mark this order as paid' }), 'OPERATOR_CHANNEL_WRITE_BLOCKED'],
    ['unknown provider', message({ provider: 'discord' }), 'OPERATOR_CHANNEL_PROVIDER_DENIED'],
  ])('denies %s', (_label, input, code) => {
    expect(new OperatorChannelPolicy(config()).evaluate(input)).toMatchObject({ allowed: false, code });
  });

  test('denies missing allowlists for a real provider', () => {
    const decision = new OperatorChannelPolicy(config({
      provider: 'telegram',
      allowedUserIds: [],
      allowedChatIds: [],
    })).evaluate(message({ provider: 'telegram' }));
    expect(decision).toMatchObject({ allowed: false, code: 'OPERATOR_CHANNEL_ALLOWLIST_REQUIRED' });
  });

  test('fails closed when a required safeguard is disabled', () => {
    const decision = new OperatorChannelPolicy(config({ piiMasking: false })).evaluate(message());
    expect(decision).toMatchObject({ allowed: false, code: 'OPERATOR_CHANNEL_UNSAFE_CONFIG' });
  });

  test('keeps actions dry-run while allowing a separately approved reply transport', () => {
    const decision = new OperatorChannelPolicy(config({
      dryRun: true,
      replyDryRun: false,
    })).evaluate(message());
    expect(decision).toMatchObject({ allowed: true, dryRun: false });
  });

  test('fails closed if action dry-run is disabled', () => {
    const decision = new OperatorChannelPolicy(config({ dryRun: false })).evaluate(message());
    expect(decision).toMatchObject({ allowed: false, code: 'OPERATOR_CHANNEL_UNSAFE_CONFIG' });
  });
});

module.exports = { config, message };
