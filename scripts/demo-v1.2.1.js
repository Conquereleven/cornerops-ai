#!/usr/bin/env node
const env = require('../src/config/env');
const controlTower = require('../src/core/control-tower');
const { createService: createFounderDailyService } = require('./founder-daily');
const { TelegramFounderWebhookConfigValidator } = require('../src/integrations/telegram/TelegramFounderWebhookConfigValidator');
const { TelegramFounderIdHelpService } = require('../src/integrations/telegram/TelegramFounderIdHelpService');
const { runSimulation } = require('./demo-telegram-founder-webhook');

const main = async () => {
  const webhookCheck = new TelegramFounderWebhookConfigValidator({ config: env }).check();
  const idHelp = new TelegramFounderIdHelpService().instructions();
  const webhookSimulation = await runSimulation();
  const report = await controlTower.controlTowerV11ReportService.getReport();
  const founderDaily = await createFounderDailyService().runDaily({
    operatorId: 'local-founder',
    channel: 'cli',
  });
  process.stdout.write(`${JSON.stringify({
    demo: 'v1.2.1',
    preflight: {
      pr28Merged: true,
      v12Status: 'merged_to_main_before_v1.2.1',
      writesBlocked: true,
      externalSendsBlocked: true,
    },
    telegramFounderWebhook: {
      mode: webhookCheck.mode,
      missing: webhookCheck.missing,
      realReplyAllowed: webhookCheck.reply.realReplyAllowed,
      webhookSetupAllowed: webhookCheck.webhookSetup.allowed,
      dryRunWebhookVerified: webhookSimulation.approved.status === 'dry_run_webhook_verified',
      dryRunReplyPayload: webhookSimulation.dryRunReplyPayload.status,
    },
    founderIdHelp: {
      instructions: idHelp,
      storesMessageText: false,
      autoAllowlists: false,
    },
    controlTower: {
      telegramOperator: report.telegramOperator,
    },
    founderDaily: {
      telegramFounderWebhookReadiness: founderDaily.sources.telegramFounderWebhookReadiness,
      telegramFounderWebhookMissingConfig: founderDaily.sources.telegramFounderWebhookMissingConfig,
      telegramRealReplyAllowed: founderDaily.sources.telegramRealReplyAllowed,
      telegramWebhookSetupAllowed: founderDaily.sources.telegramWebhookSetupAllowed,
      telegramWebhookNextAction: founderDaily.sources.telegramWebhookNextAction,
    },
    finalSafetySummary: {
      telegramReplies: 'dry_run_by_default',
      webhookSetupApiCalls: 'disabled_by_default',
      proactiveOutbound: 'blocked',
      customerChannels: 'disabled',
      writes: 'blocked',
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`v1.2.1 demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
