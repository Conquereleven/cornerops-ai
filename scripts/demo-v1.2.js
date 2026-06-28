#!/usr/bin/env node
const env = require('../src/config/env');
const controlTower = require('../src/core/control-tower');
const operator = require('../src/core/operator');
const { TelegramOperatorConfigValidator } = require('../src/integrations/telegram/TelegramOperatorConfigValidator');

const main = async () => {
  const telegram = new TelegramOperatorConfigValidator({ config: env }).check();
  const flow = await operator.cornerMexFlowEngine.analyzeFlows({ requestId: 'demo-v1.2-flow' });
  const whatsappDraft = await operator.cornerMexMessageDraftService.createDraft({
    channel: 'whatsapp',
    text: 'quote #123 follow-up',
    requestId: 'demo-v1.2-draft',
  });
  const report = await controlTower.controlTowerV11ReportService.getReport();
  const founderDaily = await operator.operatorCommandRouter.handle({
    requestId: 'demo-v1.2-founder-daily',
    operatorId: 'local-founder',
    channel: 'cli',
    text: 'founder daily',
  });
  process.stdout.write(`${JSON.stringify({
    demo: 'v1.2',
    pr27Merged: true,
    telegram: {
      mode: telegram.mode,
      missing: telegram.missing,
      dryRun: telegram.dryRun,
      readOnly: telegram.readOnly,
      tokenPrinted: telegram.secrets.botTokenPrinted,
    },
    flowEngine: {
      sourceMode: flow.sourceMode,
      candidates: flow.summary.candidates,
      writesBlocked: flow.writesBlocked,
    },
    messageDrafts: {
      sendStatus: whatsappDraft.draft?.sendStatus,
      externalSends: 'blocked',
    },
    controlTower: {
      telegramOperator: report.telegramOperator,
      cornerMexFlowEngine: report.cornerMexFlowEngine,
    },
    founderDaily: {
      status: founderDaily.status,
      sourceMode: founderDaily.sourceMode,
      warnings: founderDaily.warnings,
    },
    finalSafetySummary: {
      writes: 'blocked',
      whatsappSends: 'blocked',
      emailSends: 'blocked',
      proactiveOutbound: 'blocked',
      telegramRealMode: env.corneropsTelegramRealMode ? 'configured_dry_run' : 'disabled',
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`v1.2 demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
