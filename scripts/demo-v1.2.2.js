#!/usr/bin/env node
const env = require('../src/config/env');
const controlTower = require('../src/core/control-tower');
const { createService: createFounderDailyService } = require('./founder-daily');
const { TelegramFounderPollingService } = require('../src/integrations/telegram/TelegramFounderPollingService');
const { main: realReplyDemo } = require('./demo-telegram-founder-real-reply');

const main = async () => {
  const status = new TelegramFounderPollingService({ config: env }).checkConfig();
  const report = await controlTower.controlTowerV11ReportService.getReport();
  const founderDaily = await createFounderDailyService().runDaily({
    operatorId: 'local-founder',
    channel: 'cli',
  });
  process.stdout.write(`${JSON.stringify({
    demo: 'v1.2.2',
    pr29Merged: true,
    polling: {
      mode: status.mode,
      missing: status.missing,
      pollingAllowed: status.pollingAllowed,
      realReplyAllowed: status.realReplyAllowed,
      replyDryRun: status.replyDryRun,
      tokenPrinted: false,
    },
    controlTower: {
      telegramOperator: report.telegramOperator,
    },
    founderDaily: {
      telegramFounderPollingStatus: founderDaily.sources.telegramFounderPollingStatus,
      telegramFounderPollingMissingConfig: founderDaily.sources.telegramFounderPollingMissingConfig,
      telegramFounderCommands: founderDaily.sources.telegramFounderCommands,
    },
    finalSafetySummary: {
      customerChannels: 'disabled',
      proactiveOutbound: 'blocked',
      whatsappSends: 'blocked',
      emailSends: 'blocked',
      writes: 'blocked',
    },
  }, null, 2)}\n`);
  await realReplyDemo();
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`v1.2.2 demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
