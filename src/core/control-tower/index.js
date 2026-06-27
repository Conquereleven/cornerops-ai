const env = require('../../config/env');
const openclaw = require('../../integrations/openclaw');
const agents = require('../agents');
const context = require('../context');
const data = require('../data');
const { ControlTowerService } = require('./ControlTowerService');
const { ApprovalCenterService } = require('./ApprovalCenterService');
const { AuditViewerService } = require('./AuditViewerService');
const { ControlTowerV08ReportService } = require('./ControlTowerV08ReportService');
const { ControlTowerV09ReportService } = require('./ControlTowerV09ReportService');
const { ControlTowerV10ReportService } = require('./ControlTowerV10ReportService');
const actions = require('../actions');
const { LocalStateBackupService } = require('../persistence/LocalStateBackupService');
const { FounderSetupValidator } = require('../setup/FounderSetupValidator');
const { operatorChannelStatusStore } = require('../operator-channel/OperatorChannelStatusStore');

const controlTowerService = new ControlTowerService({
  agentAuditService: agents.agentAuditService,
  agentRegistry: agents.agentRegistry,
  auditLogService: data.auditLogService,
  businessDataService: data.businessDataService,
  config: env,
  contextHealthService: context.contextHealthService,
  dataHealthService: data.dataHealthService,
  dataContractRegistry: data.businessDataContractRegistry,
  ecosystemRegistry: data.ecosystemRegistry,
  githubClient: data.githubClient,
  humanApprovalService: openclaw.humanApprovalService,
  openclawAuditService: openclaw.auditLogService,
  openclawConfig: openclaw.config,
  schemaDiscoveryService: data.schemaDiscoveryService,
  firstRealSourceReadinessService: data.firstRealSourceReadinessService,
  operatorChannelStatusProvider: () => operatorChannelStatusStore.getStatus({
    enabled: env.corneropsRealOperatorChannelEnabled,
    provider: env.corneropsOperatorChannelProvider,
    dryRun: env.corneropsOperatorChannelDryRun,
    replyEnabled: env.corneropsOperatorReplyEnabled,
    replyDryRun: env.corneropsOperatorReplyDryRun,
    requireAllowlist: env.corneropsOperatorRequireAllowlist,
    allowedUserIds: [...new Set([
      ...env.corneropsOperatorAllowedUserIds,
      ...env.telegramOperatorAllowedUserIds,
      ...env.slackOperatorAllowedUserIds,
    ])],
    allowedChannelIds: [...new Set([
      ...env.corneropsOperatorAllowedChannelIds,
      ...env.slackOperatorAllowedChannelIds,
    ])],
    allowedChatIds: [...new Set([
      ...env.corneropsOperatorAllowedChatIds,
      ...env.telegramOperatorAllowedChatIds,
    ])],
  }),
  operatorChannelSecurityProvider: async () => {
    const channel = require('../operator-channel');
    const [replay, rejections, rateLimit, rejectionSummary] = await Promise.all([
      channel.replayProtectionService.health(),
      channel.rejectionTrackingService.health(),
      channel.operatorRateLimitService.health(),
      channel.rejectionTrackingService.summary(),
    ]);
    const warnings = [];
    if (!replay.healthy) warnings.push('Replay store is unavailable.');
    if (!rejections.healthy) warnings.push('Rejection store is unavailable.');
    if (!rateLimit.healthy) warnings.push('Rate limit store is unavailable.');
    if (!env.telegramOperatorBotToken) warnings.push('Telegram bot token is missing.');
    if (!env.telegramOperatorWebhookSecret) warnings.push('Telegram webhook secret is missing.');
    if (!env.telegramOperatorAllowedUserIds.length) warnings.push('Telegram user allowlist is empty.');
    if (!env.telegramOperatorAllowedChatIds.length) warnings.push('Telegram chat allowlist is empty.');
    return {
      telegram: {
        enabled: env.telegramOperatorEnabled && env.corneropsTelegramActivationEnabled,
        realMode: env.corneropsTelegramRealMode,
        dryRun: env.corneropsTelegramDryRun || env.telegramOperatorDryRun,
        replyEnabled: env.telegramOperatorReplyEnabled && env.corneropsOperatorReplyEnabled,
        replyDryRun: env.telegramOperatorReplyDryRun || env.corneropsOperatorReplyDryRun,
        allowedUsersCount: env.telegramOperatorAllowedUserIds.length,
        allowedChatsCount: env.telegramOperatorAllowedChatIds.length,
        rejectsGroups: env.telegramOperatorRejectGroups,
        replayProtection: {
          enabled: env.corneropsReplayProtectionEnabled,
          storeHealthy: replay.healthy,
          storeProvider: replay.provider,
          storePath: replay.path,
          ttlSeconds: env.corneropsReplayTtlSeconds,
        },
        rejectionTracking: {
          enabled: env.corneropsRejectionStoreEnabled,
          storeHealthy: rejections.healthy,
          storePath: rejections.path,
          rejectedLast24h: rejectionSummary.rejectedLast24h,
          byReason: rejectionSummary.byReason,
        },
        rateLimiting: {
          enabled: env.corneropsRateLimitingEnabled,
          storeHealthy: rateLimit.healthy,
          storePath: rateLimit.path,
          limitPerMinute: env.corneropsOperatorRateLimitPerMinute,
          burst: env.corneropsOperatorRateLimitBurst,
        },
        warnings,
      },
    };
  },
});

const approvalCenterService = new ApprovalCenterService({
  approvalService: data.approvalService,
  auditLogService: data.auditLogService,
  config: env,
});
const auditViewerService = new AuditViewerService({
  agentAuditService: agents.agentAuditService,
  auditLogService: data.auditLogService,
  config: env,
  openclawAuditService: openclaw.auditLogService,
  rejectionProvider: (options) => {
    const channel = require('../operator-channel');
    return channel.rejectionTrackingService.list(options);
  },
});
const controlTowerV08ReportService = new ControlTowerV08ReportService({
  approvalCenterService,
  auditViewerService,
  baseService: controlTowerService,
  config: env,
});
const controlTowerV09ReportService = new ControlTowerV09ReportService({
  approvalCenterService,
  baseService: controlTowerV08ReportService,
  controlledActionExecutor: actions.controlledActionExecutor,
  config: env,
});
const localStateBackupService = new LocalStateBackupService({
  backupRoot: env.corneropsBackupRoot || './.cornerops/backups',
});
const founderSetupValidator = new FounderSetupValidator({ config: env });
const controlTowerV10ReportService = new ControlTowerV10ReportService({
  backupService: localStateBackupService,
  baseService: controlTowerV09ReportService,
  setupValidator: founderSetupValidator,
});

module.exports = {
  ApprovalCenterService,
  AuditViewerService,
  ControlTowerService,
  ControlTowerV08ReportService,
  ControlTowerV09ReportService,
  ControlTowerV10ReportService,
  approvalCenterService,
  auditViewerService,
  controlTowerService,
  controlTowerV08ReportService,
  controlTowerV09ReportService,
  controlTowerV10ReportService,
  founderSetupValidator,
  localStateBackupService,
};
