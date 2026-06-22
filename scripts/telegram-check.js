const env = require('../src/config/env');
const {
  operatorRateLimitService,
  rejectionTrackingService,
  replayProtectionService,
} = require('../src/core/operator-channel');

const checks = [
  ['TELEGRAM_OPERATOR_BOT_TOKEN', Boolean(env.telegramOperatorBotToken)],
  ['TELEGRAM_OPERATOR_WEBHOOK_SECRET', Boolean(env.telegramOperatorWebhookSecret)],
  ['TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS', env.telegramOperatorAllowedChatIds.length > 0],
  ['TELEGRAM_OPERATOR_ALLOWED_USER_IDS', env.telegramOperatorAllowedUserIds.length > 0],
];

const run = async () => {
  const [replay, rejections, rateLimit] = await Promise.all([
    replayProtectionService.health(),
    rejectionTrackingService.health(),
    operatorRateLimitService.health(),
  ]);
  console.log('CornerOps Telegram v0.7 readiness check');
  checks.forEach(([key, present]) => console.log(`${key}: ${present ? 'present' : 'missing'}`));
  console.log(`Provider: ${env.corneropsOperatorChannelProvider}`);
  console.log(`Activation enabled: ${env.corneropsTelegramActivationEnabled}`);
  console.log(`Real mode: ${env.corneropsTelegramRealMode}`);
  console.log(`Action dry-run: ${env.corneropsTelegramDryRun}`);
  console.log(`Reply dry-run: ${env.telegramOperatorReplyDryRun || env.corneropsOperatorReplyDryRun}`);
  console.log(`Groups rejected: ${env.telegramOperatorRejectGroups}`);
  console.log(`Unknown senders rejected: ${env.corneropsOperatorRejectUnknownSenders}`);
  console.log(`Replay store: ${replay.healthy ? 'healthy' : 'unavailable'} (${replay.provider})`);
  console.log(`Rejection store: ${rejections.healthy ? 'healthy' : 'unavailable'} (${rejections.provider})`);
  console.log(`Rate limit store: ${rateLimit.healthy ? 'healthy' : 'unavailable'} (${rateLimit.provider})`);
  if (checks.some(([, present]) => !present)) {
    console.log('Telegram real use is not ready. See docs/runbooks/telegram-operator-runbook-v0.7.md.');
  } else {
    console.log('Credentials and allowlists are present. Validate HTTPS dry-run events before real replies.');
  }
  console.log('No token value was printed and no message was sent.');
};

run().catch((error) => {
  console.error(`Telegram readiness check failed safely: ${error.code || error.message}`);
  process.exitCode = 1;
});
