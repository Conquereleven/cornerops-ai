#!/usr/bin/env node
const env = require('../src/config/env');
const { TelegramOperatorConfigValidator } = require('../src/integrations/telegram/TelegramOperatorConfigValidator');

const main = () => {
  const result = new TelegramOperatorConfigValidator({ config: env }).check();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.safe) process.exitCode = 1;
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`Telegram operator check failed safely: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main };
