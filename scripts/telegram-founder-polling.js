#!/usr/bin/env node
const env = require('../src/config/env');
const data = require('../src/core/data');
const operator = require('../src/core/operator');
const operatorChannel = require('../src/core/operator-channel');
const { OperatorChatResponseFormatter } = require('../src/core/operator/OperatorChatResponseFormatter');
const { TelegramOperatorChannelAdapter } = require('../src/integrations/telegram/TelegramOperatorChannelAdapter');
const {
  TelegramFounderPollingService,
  buildTelegramPollingAdapterConfig,
} = require('../src/integrations/telegram/TelegramFounderPollingService');
const { TelegramFounderRealReplyService } = require('../src/integrations/telegram/TelegramFounderRealReplyService');

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

const createService = () => {
  const replyService = new TelegramFounderRealReplyService({ config: env });
  const adapter = new TelegramOperatorChannelAdapter({
    config: buildTelegramPollingAdapterConfig(env),
    rateLimitService: operatorChannel.operatorRateLimitService,
    rejectionTrackingService: operatorChannel.rejectionTrackingService,
    replayProtectionService: operatorChannel.replayProtectionService,
  });
  const service = new TelegramFounderPollingService({
    adapter,
    auditLogService: data.auditLogService,
    commandRouter: operator.operatorCommandRouter,
    config: env,
    formatter: new OperatorChatResponseFormatter({
      maxMessageChars: env.corneropsTelegramMaxMessageChars,
    }),
    replyService,
  });
  adapter.connect(service.createPollingChannelService());
  return service;
};

const main = async () => {
  const service = createService();
  const startup = service.checkConfig();
  process.stdout.write(`${JSON.stringify({
    command: 'telegram_founder_polling_v1.2.2',
    startup: {
      mode: startup.mode,
      enabled: startup.enabled,
      operatorMode: startup.operatorMode,
      pollingAllowed: startup.pollingAllowed,
      allowedUsersCount: startup.allowedUsersCount,
      allowedChatsCount: startup.allowedChatsCount,
      dryRun: startup.dryRun,
      replyDryRun: startup.replyDryRun,
      realReplyAllowed: startup.realReplyAllowed,
      writesBlocked: startup.writesBlocked,
      externalSendsBlocked: true,
      missing: startup.missing,
      unsafe: startup.unsafe,
      tokenPrinted: false,
    },
  }, null, 2)}\n`);
  if (startup.mode === 'missing_config' || startup.mode === 'blocked_unsafe_config') return;
  let stop = false;
  process.on('SIGINT', () => { stop = true; });
  process.on('SIGTERM', () => { stop = true; });
  while (!stop) {
    const result = await service.runPolling({ maxIterations: 1 });
    process.stdout.write(`${JSON.stringify({
      event: 'telegram_founder_polling_tick',
      status: result.status,
      processed: result.processed.map((item) => ({
        status: item.status,
        auditId: item.auditId,
        warnings: item.warnings,
      })),
    }, null, 2)}\n`);
    if (!stop) await sleep(env.corneropsTelegramPollingIntervalMs);
  }
  process.stdout.write(`${JSON.stringify({ event: 'telegram_founder_polling_stopped', graceful: true }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Telegram founder polling failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { createService, main };
