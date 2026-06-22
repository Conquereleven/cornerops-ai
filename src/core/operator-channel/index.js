const env = require('../../config/env');
const data = require('../data');
const { operatorCommandRouter } = require('../operator');
const { OperatorChatResponseFormatter } = require('../operator/OperatorChatResponseFormatter');
const { OpenClawOperatorChannelBridge } = require('../../integrations/openclaw/OpenClawOperatorChannelBridge');
const { TelegramOperatorChannelAdapter } = require('../../integrations/telegram/TelegramOperatorChannelAdapter');
const { MockOperatorChannelAdapter } = require('./adapters/MockOperatorChannelAdapter');
const { OperatorChannelMessageNormalizer } = require('./OperatorChannelMessageNormalizer');
const { OperatorChannelPolicy } = require('./OperatorChannelPolicy');
const { OperatorChannelRegistry } = require('./OperatorChannelRegistry');
const { OperatorChannelResponseService } = require('./OperatorChannelResponseService');
const { OperatorChannelRouter } = require('./OperatorChannelRouter');
const { OperatorChannelService } = require('./OperatorChannelService');
const { operatorChannelStatusStore } = require('./OperatorChannelStatusStore');
const { createOperatorSecurityServices } = require('../security');

const providerAllowlist = (provider) => {
  if (provider === 'telegram') {
    return {
      users: [...new Set([...env.corneropsOperatorAllowedUserIds, ...env.telegramOperatorAllowedUserIds])],
      chats: [...new Set([...env.corneropsOperatorAllowedChatIds, ...env.telegramOperatorAllowedChatIds])],
      channels: env.corneropsOperatorAllowedChannelIds,
    };
  }
  if (provider === 'slack') {
    return {
      users: [...new Set([...env.corneropsOperatorAllowedUserIds, ...env.slackOperatorAllowedUserIds])],
      chats: env.corneropsOperatorAllowedChatIds,
      channels: [...new Set([...env.corneropsOperatorAllowedChannelIds, ...env.slackOperatorAllowedChannelIds])],
    };
  }
  return {
    users: env.corneropsOperatorAllowedUserIds,
    chats: env.corneropsOperatorAllowedChatIds,
    channels: env.corneropsOperatorAllowedChannelIds,
  };
};

const allowlist = providerAllowlist(env.corneropsOperatorChannelProvider);
const config = {
  enabled: env.corneropsRealOperatorChannelEnabled,
  provider: env.corneropsOperatorChannelProvider,
  providerEnabled: env.corneropsOperatorChannelProvider === 'mock'
    || (
      env.corneropsOperatorChannelProvider === 'telegram'
      && env.telegramOperatorEnabled
      && env.corneropsTelegramActivationEnabled
    )
    || (env.corneropsOperatorChannelProvider === 'openclaw' && env.openclawOperatorChannelEnabled),
  mode: env.corneropsOperatorChannelMode,
  dryRun: env.corneropsOperatorChannelDryRun,
  requireApproval: env.corneropsOperatorChannelRequireApproval,
  allowedUserIds: allowlist.users,
  allowedChannelIds: allowlist.channels,
  allowedChatIds: allowlist.chats,
  replyEnabled: env.corneropsOperatorReplyEnabled,
  replyDryRun: env.corneropsOperatorReplyDryRun,
  rejectUnknownSenders: env.corneropsOperatorRejectUnknownSenders,
  requireAllowlist: env.corneropsOperatorRequireAllowlist,
  maxMessageChars: env.corneropsOperatorMaxMessageChars,
  piiMasking: env.corneropsOperatorPiiMasking,
  logSanitization: env.corneropsOperatorLogSanitization,
  failClosed: env.corneropsFailClosed,
  requireAudit: env.corneropsRequireAuditForOperatorRequests,
  requireApprovalForExternalActions: env.corneropsRequireApprovalForExternalActions,
  requireApprovalForWrites: env.corneropsRequireApprovalForWrites,
};

const operatorSecurity = createOperatorSecurityServices({
  auditLogService: data.auditLogService,
  config: env,
});

const mockOperatorChannelAdapter = new MockOperatorChannelAdapter({ dryRun: true });
const telegramOperatorChannelAdapter = new TelegramOperatorChannelAdapter({
  config: {
    enabled: env.telegramOperatorEnabled && env.corneropsTelegramActivationEnabled,
    realMode: env.corneropsTelegramRealMode,
    botToken: env.telegramOperatorBotToken,
    allowedChatIds: env.telegramOperatorAllowedChatIds,
    allowedUserIds: env.telegramOperatorAllowedUserIds,
    webhookSecret: env.telegramOperatorWebhookSecret,
    dryRun: env.telegramOperatorDryRun || env.corneropsTelegramDryRun,
    failClosed: env.corneropsTelegramFailClosed,
    persistentSecurity: env.corneropsReplayStoreProvider === 'file'
      && env.corneropsReplayProtectionEnabled
      && env.corneropsRejectionStoreEnabled
      && env.corneropsRateLimitingEnabled,
    readOnly: env.corneropsTelegramReadOnly,
    rejectGroups: env.telegramOperatorRejectGroups,
    replyDryRun: env.telegramOperatorReplyDryRun || env.corneropsOperatorReplyDryRun,
    replyEnabled: env.telegramOperatorReplyEnabled && env.corneropsOperatorReplyEnabled,
    requireDm: env.telegramOperatorRequireDm,
  },
  rateLimitService: operatorSecurity.operatorRateLimitService,
  rejectionTrackingService: operatorSecurity.rejectionTrackingService,
  replayProtectionService: operatorSecurity.replayProtectionService,
});
const openClawOperatorChannelBridge = new OpenClawOperatorChannelBridge({
  config: {
    enabled: env.openclawOperatorChannelEnabled,
    dryRun: env.openclawOperatorChannelDryRun,
  },
});
const operatorChannelRegistry = new OperatorChannelRegistry([
  mockOperatorChannelAdapter,
  telegramOperatorChannelAdapter,
  openClawOperatorChannelBridge,
]);
const operatorChannelPolicy = new OperatorChannelPolicy(config);
const operatorChannelMessageNormalizer = new OperatorChannelMessageNormalizer();
const operatorChatResponseFormatter = new OperatorChatResponseFormatter({
  maxMessageChars: env.corneropsOperatorMaxMessageChars,
});
const operatorChannelRouter = new OperatorChannelRouter({ operatorCommandRouter });
const operatorChannelResponseService = new OperatorChannelResponseService({
  registry: operatorChannelRegistry,
  statusStore: operatorChannelStatusStore,
});
const operatorChannelService = new OperatorChannelService({
  auditLogService: data.auditLogService,
  chatFormatter: operatorChatResponseFormatter,
  config,
  normalizer: operatorChannelMessageNormalizer,
  policy: operatorChannelPolicy,
  responseService: operatorChannelResponseService,
  router: operatorChannelRouter,
  statusStore: operatorChannelStatusStore,
  rejectionTrackingService: operatorSecurity.rejectionTrackingService,
});

mockOperatorChannelAdapter.connect(operatorChannelService);
telegramOperatorChannelAdapter.connect(operatorChannelService);
openClawOperatorChannelBridge.connect(operatorChannelService);

module.exports = {
  config,
  mockOperatorChannelAdapter,
  openClawOperatorChannelBridge,
  operatorChannelMessageNormalizer,
  operatorChannelPolicy,
  operatorChannelRegistry,
  operatorChannelResponseService,
  operatorChannelRouter,
  operatorChannelService,
  operatorChannelStatusStore,
  operatorChatResponseFormatter,
  operatorRateLimitService: operatorSecurity.operatorRateLimitService,
  rejectionTrackingService: operatorSecurity.rejectionTrackingService,
  replayProtectionService: operatorSecurity.replayProtectionService,
  telegramOperatorChannelAdapter,
  MockOperatorChannelAdapter,
  OperatorChannelMessageNormalizer,
  OperatorChannelPolicy,
  OperatorChannelRegistry,
  OperatorChannelResponseService,
  OperatorChannelRouter,
  OperatorChannelService,
};
