const required = [
  'TELEGRAM_OPERATOR_BOT_TOKEN',
  'TELEGRAM_OPERATOR_WEBHOOK_SECRET',
  'TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS',
  'TELEGRAM_OPERATOR_ALLOWED_USER_IDS',
];

const missing = required.filter((key) => !process.env[key]);
const configured = process.env.CORNEROPS_REAL_OPERATOR_CHANNEL_ENABLED === 'true'
  && process.env.CORNEROPS_OPERATOR_CHANNEL_PROVIDER === 'telegram'
  && process.env.CORNEROPS_TELEGRAM_ACTIVATION_ENABLED === 'true'
  && process.env.TELEGRAM_OPERATOR_ENABLED === 'true'
  && !missing.length;

if (!configured) {
  console.log('CornerOps real Telegram operator channel is not configured.');
  console.log(`Missing or disabled: ${missing.join(', ') || 'channel enable flags'}`);
  console.log('See docs/runbooks/operator-channel-setup.md. No message was sent.');
  process.exit(0);
}

console.log('Telegram operator channel configuration is present.');
console.log('Webhook endpoint: POST /api/operator-channel/telegram/webhook');
console.log(`Reply mode: ${process.env.CORNEROPS_OPERATOR_REPLY_DRY_RUN !== 'false' ? 'dry_run' : 'explicit real reply'}`);
console.log('This readiness command does not send a message or start polling.');
