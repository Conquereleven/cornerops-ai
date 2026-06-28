#!/usr/bin/env node
const env = require('../src/config/env');
const { TelegramFounderPollingService } = require('../src/integrations/telegram/TelegramFounderPollingService');

const main = async () => {
  const service = new TelegramFounderPollingService({ config: env });
  const result = await service.discoverFounderIds({ windowMs: 60000 });
  process.stdout.write(`${JSON.stringify({
    command: 'telegram_founder_id_discovery_v1.2.2',
    ...result,
    safety: {
      tokenPrinted: false,
      fullMessageTextPrinted: false,
      repliesSent: false,
      autoAllowlisted: false,
      groupsAccepted: false,
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Telegram founder ID discovery failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
