process.env.CORNEROPS_REAL_OPERATOR_CHANNEL_ENABLED = 'true';
process.env.CORNEROPS_CLI_MODE = 'true';
process.env.CORNEROPS_OPERATOR_CHANNEL_PROVIDER = 'mock';
process.env.CORNEROPS_OPERATOR_CHANNEL_MODE = 'read_only';
process.env.CORNEROPS_OPERATOR_CHANNEL_DRY_RUN = 'true';
process.env.CORNEROPS_OPERATOR_CHANNEL_REQUIRE_APPROVAL = 'true';
process.env.CORNEROPS_OPERATOR_ALLOWED_USER_IDS = 'demo-founder';
process.env.CORNEROPS_OPERATOR_ALLOWED_CHAT_IDS = 'demo-chat';
process.env.CORNEROPS_OPERATOR_REPLY_DRY_RUN = 'true';
process.env.CORNEROPS_OPERATOR_REQUIRE_ALLOWLIST = 'true';
process.env.CORNEROPS_OPERATOR_PII_MASKING = 'true';
process.env.CORNEROPS_OPERATOR_LOG_SANITIZATION = 'true';
process.env.CORNEROPS_OPERATOR_INTERFACE_ENABLED = 'true';
process.env.CORNEROPS_OPERATOR_DRY_RUN = 'true';
process.env.CORNEROPS_OPERATOR_READ_ONLY = 'true';
process.env.CORNEROPS_OPERATOR_REQUIRE_APPROVAL = 'true';
process.env.CORNEROPS_BUSINESS_DATA_ENABLED = 'false';
process.env.CORNEROPS_DB_ALLOW_WRITES = 'false';
process.env.GITHUB_ENABLED = 'false';
process.env.OPENCLAW_ENABLED = 'false';
process.env.OPENCLAW_OPERATOR_CHANNEL_ENABLED = 'false';
process.env.TELEGRAM_OPERATOR_ENABLED = 'false';
process.env.SLACK_OPERATOR_ENABLED = 'false';
process.env.CRAWLERS_ENABLED = 'false';
process.env.CLAWHUB_ENABLED = 'false';

const data = require('../src/core/data');
const {
  config,
  mockOperatorChannelAdapter,
  operatorChannelStatusStore,
} = require('../src/core/operator-channel');

const approved = {
  chatId: 'demo-chat',
  channelId: 'demo-chat',
  userId: 'demo-founder',
};

const steps = [
  ['1. Help', 'help', approved],
  ['2. Daily briefing', "Give me today's briefing", approved],
  ['3. B2B follow-up', 'Which B2B leads need follow-up?', approved],
  ['4. Quotes and orders', 'Which quotes need follow-up?', approved],
  ['5. GitHub summary', 'Review GitHub issues for Codex', approved],
  ['6. Security audit', 'Show security audit risks', approved],
  ['7. Unknown sender', 'help', { ...approved, userId: 'unknown-user' }],
  ['8. Write request', 'Mark this order as paid', approved],
  ['9. Audit summary', 'Show audit summary', approved],
];

const run = async () => {
  console.log('CornerOps Real Operator Channel v0.6 (mock/read-only/dry-run)');
  console.log('Initial status:', JSON.stringify(operatorChannelStatusStore.getStatus(config)));
  for (const [label, text, identity] of steps) {
    const output = await mockOperatorChannelAdapter.simulateInbound({
      id: `operator-channel-demo-${label.split('.')[0]}`,
      ...identity,
      text,
    });
    console.log(`\n=== ${label} ===`);
    console.log(output.text);
    console.log(`Delivery: ${output.status}`);
  }
  const audit = await data.auditLogService.list({ limit: 500 });
  const events = audit.filter((event) => event.eventType?.startsWith('operator_channel_'));
  console.log('\n=== 10. Channel audit summary ===');
  console.log(`Operator channel audit events: ${events.length}`);
  console.log('Final status:', JSON.stringify(operatorChannelStatusStore.getStatus(config)));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
