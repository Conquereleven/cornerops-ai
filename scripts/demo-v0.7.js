process.env.CORNEROPS_CLI_MODE = 'true';
process.env.CORNEROPS_REAL_OPERATOR_CHANNEL_ENABLED = 'true';
process.env.CORNEROPS_OPERATOR_CHANNEL_PROVIDER = 'telegram';
process.env.CORNEROPS_OPERATOR_CHANNEL_DRY_RUN = 'true';
process.env.CORNEROPS_TELEGRAM_ACTIVATION_ENABLED = 'true';
process.env.CORNEROPS_TELEGRAM_REAL_MODE = 'false';
process.env.TELEGRAM_OPERATOR_ENABLED = 'true';
process.env.TELEGRAM_OPERATOR_BOT_TOKEN = 'demo-token-not-real';
process.env.TELEGRAM_OPERATOR_WEBHOOK_SECRET = 'demo-v07-secret';
process.env.TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS = '7101';
process.env.TELEGRAM_OPERATOR_ALLOWED_USER_IDS = '7101';
process.env.TELEGRAM_OPERATOR_DRY_RUN = 'true';
process.env.TELEGRAM_OPERATOR_REPLY_DRY_RUN = 'true';
process.env.CORNEROPS_REPLAY_STORE_PROVIDER = 'memory';
process.env.CORNEROPS_OPERATOR_RATE_LIMIT_BURST = '20';
process.env.CORNEROPS_FIRST_REAL_SOURCE_ENABLED = 'true';
process.env.CORNEROPS_FIRST_REAL_SOURCE = 'auto';
process.env.CORNEROPS_BUSINESS_DATA_ENABLED = 'false';
process.env.GITHUB_ENABLED = 'false';
process.env.OPENCLAW_ENABLED = 'false';

const controlTower = require('../src/core/control-tower');
const {
  rejectionTrackingService,
  telegramOperatorChannelAdapter,
} = require('../src/core/operator-channel');

const messages = [
  "Give me today's briefing",
  'Which B2B leads need follow-up?',
  'Which quotes need follow-up?',
  'Which orders require action?',
  'Review GitHub issues for Codex',
  'Show security audit risks',
];

const run = async () => {
  console.log('CornerOps Telegram + First Real Source v0.7');
  const report = await controlTower.controlTowerService.getReport();
  console.log(`Control Tower: ${report.status}; firstSource=${report.firstRealSource.selectedSource}`);
  for (let index = 0; index < messages.length; index += 1) {
    const result = await telegramOperatorChannelAdapter.handleWebhook({
      update_id: 100 + index,
      message: {
        message_id: 100 + index,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 7101, type: 'private' },
        from: { id: 7101, username: 'demo-founder' },
        text: messages[index],
      },
    }, 'demo-v07-secret');
    console.log(`\n${index + 1}. ${messages[index]}\n${result.text}`);
  }
  const rejections = await rejectionTrackingService.summary();
  console.log(`\nRejected attempts: ${rejections.rejectedLast24h}`);
  console.log(`Replay healthy: ${report.telegram.replayProtection.storeHealthy}`);
  console.log('Safety: Telegram dry-run, read-only, same-chat replies; writes and external sends blocked.');
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
