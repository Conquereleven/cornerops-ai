process.env.CORNEROPS_CLI_MODE = 'true';
process.env.CORNEROPS_REAL_OPERATOR_CHANNEL_ENABLED = 'true';
process.env.CORNEROPS_OPERATOR_CHANNEL_PROVIDER = 'telegram';
process.env.CORNEROPS_OPERATOR_CHANNEL_MODE = 'read_only';
process.env.CORNEROPS_OPERATOR_CHANNEL_DRY_RUN = 'true';
process.env.CORNEROPS_OPERATOR_CHANNEL_REQUIRE_APPROVAL = 'true';
process.env.CORNEROPS_OPERATOR_REPLY_DRY_RUN = 'true';
process.env.CORNEROPS_TELEGRAM_ACTIVATION_ENABLED = 'true';
process.env.CORNEROPS_TELEGRAM_REAL_MODE = 'false';
process.env.CORNEROPS_TELEGRAM_DRY_RUN = 'true';
process.env.CORNEROPS_TELEGRAM_READ_ONLY = 'true';
process.env.TELEGRAM_OPERATOR_ENABLED = 'true';
process.env.TELEGRAM_OPERATOR_BOT_TOKEN = 'demo-token-not-real';
process.env.TELEGRAM_OPERATOR_WEBHOOK_SECRET = 'demo-webhook-secret';
process.env.TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS = '7001';
process.env.TELEGRAM_OPERATOR_ALLOWED_USER_IDS = '7001';
process.env.TELEGRAM_OPERATOR_DRY_RUN = 'true';
process.env.TELEGRAM_OPERATOR_REPLY_DRY_RUN = 'true';
process.env.CORNEROPS_REPLAY_STORE_PROVIDER = 'memory';
process.env.CORNEROPS_OPERATOR_RATE_LIMIT_PER_MINUTE = '2';
process.env.CORNEROPS_OPERATOR_RATE_LIMIT_BURST = '2';
process.env.CORNEROPS_BUSINESS_DATA_ENABLED = 'false';
process.env.GITHUB_ENABLED = 'false';
process.env.OPENCLAW_ENABLED = 'false';

const data = require('../src/core/data');
const {
  rejectionTrackingService,
  telegramOperatorChannelAdapter,
} = require('../src/core/operator-channel');

const update = (updateId, text = 'help', overrides = {}) => ({
  update_id: updateId,
  message: {
    message_id: updateId,
    date: Math.floor(Date.now() / 1000),
    chat: { id: overrides.chatId || 7001, type: overrides.chatType || 'private' },
    from: { id: overrides.userId || 7001, username: overrides.username || 'demo-founder' },
    text,
  },
});

const runStep = async (label, payload) => {
  console.log(`\n=== ${label} ===`);
  try {
    const result = await telegramOperatorChannelAdapter.handleWebhook(payload, 'demo-webhook-secret');
    console.log(result.text || result.status);
    console.log(`Status: ${result.status}`);
  } catch (error) {
    console.log(`Rejected: ${error.code}`);
  }
};

const run = async () => {
  console.log('CornerOps Telegram Activation v0.7 (mock/read-only/dry-run)');
  await runStep('1. Approved Telegram DM', update(1, 'help'));
  await runStep('2. Unknown sender', update(2, 'help', { userId: 9999 }));
  await runStep('3. Group rejected', update(3, 'help', { chatType: 'group' }));
  await runStep('4. Replay duplicate', update(1, 'help'));
  await runStep('5. Rate limit allowance', update(4, 'data health'));
  await runStep('6. Rate limit rejected', update(5, 'context health'));
  const summary = await rejectionTrackingService.summary();
  console.log('\n=== 7. Rejection summary ===');
  console.log(JSON.stringify(summary));
  const audit = await data.auditLogService.list({ limit: 500 });
  console.log('\n=== 8. Audit summary ===');
  console.log(`Telegram/security audit events: ${audit.filter((event) => /operator|telegram|replay|rate/i.test(event.eventType)).length}`);
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
