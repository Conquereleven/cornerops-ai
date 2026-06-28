const { combineSourceModes, SOURCE_MODES } = require('../real-source/sourceMode');

class ControlTowerV11ReportService {
  constructor({
    baseService,
    businessDataReadinessService,
    cornerMexConfigIntakeService,
    cornerMexConnector,
    githubReadinessService,
    config = {},
  } = {}) {
    this.baseService = baseService;
    this.businessDataReadinessService = businessDataReadinessService;
    this.cornerMexConfigIntakeService = cornerMexConfigIntakeService;
    this.cornerMexConnector = cornerMexConnector;
    this.githubReadinessService = githubReadinessService;
    this.config = config;
  }

  async getReport() {
    const [base, github, businessData, cornerMexLovableConnector, cornerMexConfigIntake] = await Promise.all([
      this.baseService.getReport(),
      this.githubReadinessService.check({ testReads: false }),
      this.businessDataReadinessService.check({ testReads: false }),
      this.cornerMexConnector?.getConnectorStatus
        ? this.cornerMexConnector.getConnectorStatus({ agentId: 'control-tower-v1.1.1' })
        : Promise.resolve(null),
      this.cornerMexConfigIntakeService?.check
        ? this.cornerMexConfigIntakeService.check({ agentId: 'control-tower-v1.1.2' })
        : Promise.resolve(null),
    ]);
    const sourceMode = combineSourceModes([
      github.mode,
      businessData.mode,
      cornerMexLovableConnector?.sourceMode,
      base.openclaw?.enabled ? base.openclaw?.mode : SOURCE_MODES.DISABLED,
      SOURCE_MODES.LOCAL_INTERNAL,
      this.config.corneropsDryRun ? SOURCE_MODES.DRY_RUN : null,
    ]);
    const blockedWriteFlags = {
      githubIssueCreation: !this.config.githubAllowIssueCreation,
      githubPrWrite: !this.config.githubAllowPrWrite,
      githubWorkflowTrigger: !this.config.githubAllowWorkflowTrigger,
      businessDbWrites: !this.config.corneropsDbAllowWrites,
      controlledActionsRealExecution: this.config.corneropsControlledActionsDryRun !== false,
      externalSends: base.safety?.externalSendsBlocked === true,
      whatsapp: base.safety?.whatsappDisabled === true,
      nativeTools: base.safety?.nativeToolsDisabled === true,
      clawhubExecution: base.safety?.clawhubExecutionDisabled === true,
    };
    const telegramOperator = await this.getTelegramOperatorStatus(base);
    const cornerMexFlowEngine = await this.getCornerMexFlowEngineStatus(cornerMexLovableConnector);
    const warnings = [
      ...(base.safety?.warnings || []),
      ...github.warnings,
      ...businessData.warnings,
      ...(cornerMexLovableConnector?.warnings || []),
      ...(cornerMexConfigIntake?.warnings || []),
      ...(telegramOperator.warnings || []),
    ];
    return {
      ...base,
      version: 'v1.1',
      generatedAt: new Date().toISOString(),
      realSourceExpansion: {
        version: 'v1.1',
        selectedSource: github.connected ? 'github' : businessData.mode === SOURCE_MODES.REAL_READ_ONLY ? 'business_db' : 'mock',
        selectedSourceMode: github.connected ? SOURCE_MODES.REAL_READ_ONLY : businessData.mode,
        sourceModeSummary: sourceMode,
        github,
        businessData,
        agentUsage: {
          'dev-codex-github-agent': github.connected ? SOURCE_MODES.REAL_READ_ONLY : SOURCE_MODES.MOCK,
          'daily-briefing-agent': combineSourceModes([github.mode, businessData.mode]),
          'security-audit-agent': combineSourceModes([github.mode, businessData.mode, SOURCE_MODES.LOCAL_INTERNAL]),
          'b2b-sales-agent': combineSourceModes([businessData.mode, cornerMexLovableConnector?.sourceMode]),
          'quotes-orders-agent': combineSourceModes([businessData.mode, cornerMexLovableConnector?.sourceMode]),
          'daily-briefing-agent-cornermex': cornerMexLovableConnector?.sourceMode || SOURCE_MODES.MOCK,
        },
        blockedWriteFlags,
        warnings: [...new Set(warnings)],
      },
      cornerMexLovableConnector: cornerMexLovableConnector ? {
        ...cornerMexLovableConnector,
        version: 'v1.1.3',
        configIntake: cornerMexConfigIntake,
        configIntakeStatus: cornerMexConfigIntake?.status || 'unknown',
        configCompleteness: cornerMexConfigIntake?.configCompleteness || {},
        supabaseMigrationDiscoveryStatus: cornerMexLovableConnector.schemaDiscovery?.status || 'not_available',
        schemaDiscovered: cornerMexLovableConnector.schemaDiscovery?.status === 'schema_discovered',
        discoveredTablesCount: cornerMexLovableConnector.schemaDiscovery?.tables?.length || 0,
        mappedContractConfidence: cornerMexLovableConnector.contractConfidence,
        rlsEvidenceStatus: cornerMexLovableConnector.schemaDiscovery?.rlsPoliciesDiscovered?.length ? 'present_in_repo_migrations' : 'not_found',
        piiCandidateFields: cornerMexLovableConnector.schemaDiscovery?.piiCandidateFields || [],
        supabaseRealReadOnlyReadiness: cornerMexLovableConnector.sourceMode === 'real_read_only' ? 'ready' : 'pending_credentials',
        discoveredWriteRiskPaths: cornerMexConfigIntake?.repoDiscovery?.writeRiskPaths || [],
        missingFounderConfig: cornerMexConfigIntake?.missing || [],
        exactNextRecommendedAction: cornerMexLovableConnector.schemaDiscovery?.status === 'schema_discovered'
          ? 'Add CORNERMEX_SUPABASE_URL and CORNERMEX_SUPABASE_ANON_KEY, verify RLS, then run npm run cornermex:supabase-read-only-check.'
          : cornerMexConfigIntake?.founderNextSteps?.[0] || cornerMexLovableConnector.founderNextSteps?.[0],
      } : null,
      telegramOperator,
      cornerMexFlowEngine,
      github: {
        ...base.github,
        ...github,
      },
      businessData: {
        ...base.businessData,
        readiness: businessData,
        mode: businessData.mode,
      },
      safety: {
        ...base.safety,
        warnings: [...new Set(warnings)],
      },
    };
  }

  async getTelegramOperatorStatus(base) {
    const telegram = base.telegram || {};
    return {
      version: 'v1.2',
      founderWebhookVersion: 'v1.2.1',
      founderPollingVersion: 'v1.2.2',
      enabled: this.config.telegramOperatorEnabled === true,
      operatorMode: this.config.telegramOperatorMode || 'webhook',
      realMode: this.config.corneropsTelegramRealMode === true,
      dryRun: this.config.corneropsTelegramDryRun !== false,
      readOnly: this.config.corneropsTelegramReadOnly !== false,
      founderWebhookReadiness: this.getTelegramFounderWebhookReadiness(),
      founderPollingStatus: this.getTelegramFounderPollingStatus(),
      pollingMissingConfig: this.getTelegramFounderPollingMissingConfig(),
      pollingAvailable: true,
      pollingEnabled: this.config.telegramOperatorEnabled === true
        && this.config.telegramOperatorMode === 'polling'
        && this.config.corneropsTelegramAllowPolling === true,
      botTokenPresent: Boolean(this.config.telegramOperatorBotToken),
      webhookSecretPresent: Boolean(this.config.telegramOperatorWebhookSecret),
      replyEnabled: this.config.telegramOperatorReplyEnabled !== false,
      replyDryRun: this.config.telegramOperatorReplyDryRun !== false,
      realReplyAllowed: this.config.corneropsTelegramAllowRealReply === true,
      webhookSetupAllowed: this.config.corneropsTelegramAllowWebhookSetup === true,
      pollingAllowed: this.config.corneropsTelegramAllowPolling === true,
      allowedUsersCount: telegram.allowedUsersCount || this.config.telegramOperatorAllowedUserIds?.length || 0,
      allowedChatsCount: telegram.allowedChatsCount || this.config.telegramOperatorAllowedChatIds?.length || 0,
      groupsRejected: this.config.telegramOperatorRejectGroups !== false,
      requireDm: this.config.telegramOperatorRequireDm !== false,
      replayProtection: telegram.replayProtection || { enabled: this.config.corneropsReplayProtectionEnabled === true },
      rejectionTracking: telegram.rejectionTracking || { enabled: this.config.corneropsRejectionStoreEnabled === true },
      rateLimiting: telegram.rateLimiting || { enabled: this.config.corneropsRateLimitingEnabled === true },
      missingConfig: [
        !this.config.telegramOperatorBotToken ? 'TELEGRAM_OPERATOR_BOT_TOKEN' : null,
        !this.config.telegramOperatorWebhookSecret ? 'TELEGRAM_OPERATOR_WEBHOOK_SECRET' : null,
        !(this.config.telegramOperatorAllowedUserIds || []).length ? 'TELEGRAM_OPERATOR_ALLOWED_USER_IDS' : null,
        !(this.config.telegramOperatorAllowedChatIds || []).length ? 'TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS' : null,
      ].filter(Boolean),
      lastInbound: base.operatorChannel?.lastInbound,
      lastOutbound: base.operatorChannel?.lastOutbound,
      lastDryRunWebhookVerification: telegram.lastDryRunWebhookVerification || null,
      lastPollingStart: telegram.lastPollingStart || null,
      lastApprovedInbound: telegram.lastApprovedInbound || null,
      lastReply: telegram.lastReply || null,
      rejectedUnknownUsersCount: telegram.rejectionTracking?.byReason?.TELEGRAM_UNKNOWN_USER || 0,
      rejectedUnknownChatsCount: telegram.rejectionTracking?.byReason?.TELEGRAM_UNKNOWN_CHAT || 0,
      replayDuplicateCount: telegram.replayProtection?.duplicatesLast24h || 0,
      exactNextFounderAction: this.getTelegramFounderWebhookNextAction(),
      exactNextPollingAction: this.getTelegramFounderPollingMissingConfig().length
        ? `Set polling env vars locally: ${this.getTelegramFounderPollingMissingConfig().join(', ')}.`
        : 'Run npm run telegram:founder-polling.',
      exactFounderPollingCommands: [
        'npm run telegram:founder-id-discovery',
        'npm run telegram:founder-polling',
      ],
      warnings: telegram.warnings || [],
    };
  }

  getTelegramFounderWebhookReadiness() {
    const missing = [
      !this.config.telegramOperatorBotToken,
      !this.config.telegramOperatorWebhookSecret,
      !(this.config.telegramOperatorAllowedUserIds || []).length,
      !(this.config.telegramOperatorAllowedChatIds || []).length,
    ].some(Boolean);
    if (missing) return 'missing_config';
    if (this.config.telegramOperatorRejectGroups === false || this.config.telegramOperatorRequireDm === false) {
      return 'blocked_unsafe_config';
    }
    return 'dry_run_webhook_ready';
  }

  getTelegramFounderWebhookNextAction() {
    const missing = [
      !this.config.telegramOperatorBotToken ? 'TELEGRAM_OPERATOR_BOT_TOKEN' : null,
      !this.config.telegramOperatorWebhookSecret ? 'TELEGRAM_OPERATOR_WEBHOOK_SECRET' : null,
      !(this.config.telegramOperatorAllowedUserIds || []).length ? 'TELEGRAM_OPERATOR_ALLOWED_USER_IDS' : null,
      !(this.config.telegramOperatorAllowedChatIds || []).length ? 'TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS' : null,
    ].filter(Boolean);
    if (missing.length) return `Set missing founder Telegram env vars locally: ${missing.join(', ')}.`;
    return 'Run npm run demo:telegram-founder-webhook and keep real replies disabled.';
  }

  getTelegramFounderPollingStatus() {
    const missing = this.getTelegramFounderPollingMissingConfig();
    if (missing.length) return 'missing_config';
    if (this.config.telegramOperatorRejectGroups === false || this.config.telegramOperatorRequireDm === false) {
      return 'blocked_unsafe_config';
    }
    if (
      this.config.corneropsTelegramAllowRealReply === true
      && this.config.telegramOperatorReplyDryRun === false
      && this.config.corneropsTelegramDryRun === false
      && this.config.corneropsTelegramRealMode === true
    ) {
      return 'polling_real_reply_ready';
    }
    return 'polling_dry_run_ready';
  }

  getTelegramFounderPollingMissingConfig() {
    return [
      !this.config.telegramOperatorBotToken ? 'TELEGRAM_OPERATOR_BOT_TOKEN' : null,
      this.config.telegramOperatorEnabled !== true ? 'TELEGRAM_OPERATOR_ENABLED=true' : null,
      this.config.telegramOperatorMode !== 'polling' ? 'TELEGRAM_OPERATOR_MODE=polling' : null,
      this.config.corneropsTelegramAllowPolling !== true ? 'CORNEROPS_TELEGRAM_ALLOW_POLLING=true' : null,
      !(this.config.telegramOperatorAllowedUserIds || []).length ? 'TELEGRAM_OPERATOR_ALLOWED_USER_IDS' : null,
      !(this.config.telegramOperatorAllowedChatIds || []).length ? 'TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS' : null,
    ].filter(Boolean);
  }

  async getCornerMexFlowEngineStatus(connector) {
    const sourceMode = connector?.sourceMode || SOURCE_MODES.MOCK;
    const mapped = connector?.mappedContracts || [];
    const availableFlows = [
      'b2b_lead_flow',
      'quote_follow_up_flow',
      'order_attention_flow',
      'manual_payment_review_flow',
      'product_quality_flow',
      'customer_follow_up_flow',
      'fulfillment_review_flow',
    ];
    const enoughData = mapped
      .filter((contract) => !contract.warnings?.length || contract.confidence !== 'low')
      .map((contract) => contract.entity);
    return {
      version: 'v1.2',
      enabled: true,
      sourceMode,
      availableFlows,
      flowsWithEnoughData: sourceMode === SOURCE_MODES.MOCK || sourceMode === 'repo_discovered'
        ? ['b2b_lead_flow', 'quote_follow_up_flow', 'order_attention_flow', 'manual_payment_review_flow']
        : availableFlows,
      flowsMissingData: sourceMode === 'real_read_only' ? [] : ['customer_follow_up_flow'],
      mappedContracts: mapped.map((contract) => ({
        entity: contract.entity,
        confidence: contract.confidence,
        sourceMode: contract.sourceMode,
      })),
      enoughDataContracts: enoughData,
      draftSendingDisabled: true,
      whatsappDisabled: true,
      emailSendingDisabled: true,
      writesBlocked: connector?.writesBlocked !== false,
      lastFlowAnalysisAuditId: null,
      founderNextAction: connector?.supabaseConfigured
        ? 'Use Telegram in dry-run founder DM mode and keep actions approval-gated.'
        : 'Add Supabase anon/read-only config to unlock real_read_only flow summaries.',
    };
  }
}

module.exports = { ControlTowerV11ReportService };
