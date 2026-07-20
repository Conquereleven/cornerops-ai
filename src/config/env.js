const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const parsePort = (value) => {
  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 ? port : 3000;
};

const parseBoolean = (value) =>
  ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());

const parseEnum = (value, allowed, fallback) =>
  allowed.includes(String(value || '').toLowerCase())
    ? String(value).toLowerCase()
    : fallback;

const parseInteger = (value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
};

const parseCsv = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const baseEnv = {
  nodeEnv: process.env.NODE_ENV || 'development',
  cornermexProgramEvidenceRoot: process.env.CORNERMEX_PROGRAM_EVIDENCE_ROOT || '',
  cornermexProgramEvidenceMaxAgeMs: parseInteger(process.env.CORNERMEX_PROGRAM_EVIDENCE_MAX_AGE_MS, 86400000, { min: 1, max: 604800000 }),
  cornermexProgramEvidenceMaxAgeValid: process.env.CORNERMEX_PROGRAM_EVIDENCE_MAX_AGE_MS === undefined || (/^\d+$/.test(process.env.CORNERMEX_PROGRAM_EVIDENCE_MAX_AGE_MS) && Number(process.env.CORNERMEX_PROGRAM_EVIDENCE_MAX_AGE_MS) >= 1 && Number(process.env.CORNERMEX_PROGRAM_EVIDENCE_MAX_AGE_MS) <= 604800000),
  port: parsePort(process.env.PORT),
  bindHost: process.env.CORNEROPS_BIND_HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  frontendOrigin:
    process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  useSupabase: parseBoolean(process.env.USE_SUPABASE),
  internalApiKey: process.env.INTERNAL_API_KEY || '',
  allowInternalNoKey: parseBoolean(process.env.ALLOW_INTERNAL_NO_KEY),
  aiDefaultLanguage: parseEnum(
    process.env.AI_DEFAULT_LANGUAGE,
    ['es', 'en'],
    'es',
  ),
  aiWorkersMode: parseEnum(
    process.env.AI_WORKERS_MODE,
    ['mock', 'hybrid', 'supabase'],
    'hybrid',
  ),
  corneropsBetaMode: parseBoolean(process.env.CORNEROPS_BETA_MODE),
  corneropsInternalBetaEnabled: parseBoolean(
    process.env.CORNEROPS_INTERNAL_BETA_ENABLED,
  ),
  corneropsInteractiveBetaEnabled: parseBoolean(
    process.env.CORNEROPS_INTERACTIVE_BETA_ENABLED,
  ),
  corneropsOperatorInterfaceEnabled:
    process.env.CORNEROPS_OPERATOR_INTERFACE_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_INTERFACE_ENABLED),
  corneropsOperatorInterfaceMode: parseEnum(
    process.env.CORNEROPS_OPERATOR_INTERFACE_MODE,
    ['cli', 'api', 'web'],
    'cli',
  ),
  corneropsOperatorDryRun:
    process.env.CORNEROPS_OPERATOR_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_DRY_RUN),
  corneropsOperatorReadOnly:
    process.env.CORNEROPS_OPERATOR_READ_ONLY === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_READ_ONLY),
  corneropsOperatorRequireApproval:
    process.env.CORNEROPS_OPERATOR_REQUIRE_APPROVAL === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_REQUIRE_APPROVAL),
  corneropsOperatorAllowedChannels: parseCsv(
    process.env.CORNEROPS_OPERATOR_ALLOWED_CHANNELS || 'cli,api,web',
  ),
  corneropsOperatorDefaultAgent:
    process.env.CORNEROPS_OPERATOR_DEFAULT_AGENT || 'cornerops-router-agent',
  corneropsOperatorMaxResponseChars: parseInteger(
    process.env.CORNEROPS_OPERATOR_MAX_RESPONSE_CHARS,
    12000,
    { min: 1000, max: 50000 },
  ),
  corneropsOperatorShowSourceLabels:
    process.env.CORNEROPS_OPERATOR_SHOW_SOURCE_LABELS === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_SHOW_SOURCE_LABELS),
  corneropsOperatorShowApprovalStatus:
    process.env.CORNEROPS_OPERATOR_SHOW_APPROVAL_STATUS === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_SHOW_APPROVAL_STATUS),
  corneropsOperatorShowAuditId:
    process.env.CORNEROPS_OPERATOR_SHOW_AUDIT_ID === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_SHOW_AUDIT_ID),
  corneropsCliEnabled:
    process.env.CORNEROPS_CLI_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CLI_ENABLED),
  corneropsApiEnabled: parseBoolean(process.env.CORNEROPS_API_ENABLED),
  corneropsWebUiEnabled: parseBoolean(process.env.CORNEROPS_WEB_UI_ENABLED),
  corneropsRequireAuditForOperatorRequests:
    process.env.CORNEROPS_REQUIRE_AUDIT_FOR_OPERATOR_REQUESTS === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_REQUIRE_AUDIT_FOR_OPERATOR_REQUESTS),
  corneropsRealOperatorChannelEnabled: parseBoolean(
    process.env.CORNEROPS_REAL_OPERATOR_CHANNEL_ENABLED,
  ),
  corneropsOperatorChannelProvider: parseEnum(
    process.env.CORNEROPS_OPERATOR_CHANNEL_PROVIDER,
    ['mock', 'telegram', 'slack', 'openclaw'],
    'mock',
  ),
  corneropsOperatorChannelMode: parseEnum(
    process.env.CORNEROPS_OPERATOR_CHANNEL_MODE,
    ['read_only'],
    'read_only',
  ),
  corneropsOperatorChannelDryRun:
    process.env.CORNEROPS_OPERATOR_CHANNEL_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_CHANNEL_DRY_RUN),
  corneropsOperatorChannelRequireApproval:
    process.env.CORNEROPS_OPERATOR_CHANNEL_REQUIRE_APPROVAL === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_CHANNEL_REQUIRE_APPROVAL),
  corneropsOperatorAllowedUserIds: parseCsv(process.env.CORNEROPS_OPERATOR_ALLOWED_USER_IDS),
  corneropsOperatorAllowedChannelIds: parseCsv(process.env.CORNEROPS_OPERATOR_ALLOWED_CHANNEL_IDS),
  corneropsOperatorAllowedChatIds: parseCsv(process.env.CORNEROPS_OPERATOR_ALLOWED_CHAT_IDS),
  corneropsOperatorReplyEnabled:
    process.env.CORNEROPS_OPERATOR_REPLY_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_REPLY_ENABLED),
  corneropsOperatorReplyDryRun:
    process.env.CORNEROPS_OPERATOR_REPLY_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_REPLY_DRY_RUN),
  corneropsOperatorRejectUnknownSenders:
    process.env.CORNEROPS_OPERATOR_REJECT_UNKNOWN_SENDERS === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_REJECT_UNKNOWN_SENDERS),
  corneropsOperatorRequireAllowlist:
    process.env.CORNEROPS_OPERATOR_REQUIRE_ALLOWLIST === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_REQUIRE_ALLOWLIST),
  corneropsOperatorMaxMessageChars: parseInteger(
    process.env.CORNEROPS_OPERATOR_MAX_MESSAGE_CHARS,
    12000,
    { min: 1000, max: 50000 },
  ),
  corneropsOperatorPiiMasking:
    process.env.CORNEROPS_OPERATOR_PII_MASKING === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_PII_MASKING),
  corneropsOperatorLogSanitization:
    process.env.CORNEROPS_OPERATOR_LOG_SANITIZATION === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_LOG_SANITIZATION),
  corneropsTelegramActivationEnabled: parseBoolean(
    process.env.CORNEROPS_TELEGRAM_ACTIVATION_ENABLED,
  ),
  corneropsTelegramRealMode: parseBoolean(process.env.CORNEROPS_TELEGRAM_REAL_MODE),
  corneropsTelegramDryRun:
    process.env.CORNEROPS_TELEGRAM_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_TELEGRAM_DRY_RUN),
  corneropsTelegramReadOnly:
    process.env.CORNEROPS_TELEGRAM_READ_ONLY === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_TELEGRAM_READ_ONLY),
  corneropsTelegramFailClosed:
    process.env.CORNEROPS_TELEGRAM_FAIL_CLOSED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_TELEGRAM_FAIL_CLOSED),
  corneropsTelegramAllowWebhookSetup: parseBoolean(
    process.env.CORNEROPS_TELEGRAM_ALLOW_WEBHOOK_SETUP,
  ),
  corneropsTelegramAllowRealReply: parseBoolean(
    process.env.CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY,
  ),
  corneropsTelegramAllowPolling: parseBoolean(process.env.CORNEROPS_TELEGRAM_ALLOW_POLLING),
  corneropsTelegramPollingIntervalMs: parseInteger(
    process.env.CORNEROPS_TELEGRAM_POLLING_INTERVAL_MS,
    3000,
    { min: 500, max: 60000 },
  ),
  corneropsTelegramMaxMessageChars: parseInteger(
    process.env.CORNEROPS_TELEGRAM_MAX_MESSAGE_CHARS,
    4000,
    { min: 100, max: 12000 },
  ),
  telegramOperatorEnabled: parseBoolean(process.env.TELEGRAM_OPERATOR_ENABLED),
  telegramOperatorMode: parseEnum(
    process.env.TELEGRAM_OPERATOR_MODE,
    ['webhook', 'polling'],
    'webhook',
  ),
  telegramOperatorBotToken: process.env.TELEGRAM_OPERATOR_BOT_TOKEN || '',
  telegramOperatorAllowedChatIds: parseCsv(process.env.TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS),
  telegramOperatorAllowedUserIds: parseCsv(process.env.TELEGRAM_OPERATOR_ALLOWED_USER_IDS),
  telegramOperatorWebhookSecret: process.env.TELEGRAM_OPERATOR_WEBHOOK_SECRET || '',
  telegramOperatorDryRun:
    process.env.TELEGRAM_OPERATOR_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.TELEGRAM_OPERATOR_DRY_RUN),
  telegramOperatorRequireDm:
    process.env.TELEGRAM_OPERATOR_REQUIRE_DM === undefined
      ? true
      : parseBoolean(process.env.TELEGRAM_OPERATOR_REQUIRE_DM),
  telegramOperatorRejectGroups:
    process.env.TELEGRAM_OPERATOR_REJECT_GROUPS === undefined
      ? true
      : parseBoolean(process.env.TELEGRAM_OPERATOR_REJECT_GROUPS),
  telegramOperatorReplyEnabled:
    process.env.TELEGRAM_OPERATOR_REPLY_ENABLED === undefined
      ? true
      : parseBoolean(process.env.TELEGRAM_OPERATOR_REPLY_ENABLED),
  telegramOperatorReplyDryRun:
    process.env.TELEGRAM_OPERATOR_REPLY_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.TELEGRAM_OPERATOR_REPLY_DRY_RUN),
  corneropsPersistenceProvider: parseEnum(
    process.env.CORNEROPS_PERSISTENCE_PROVIDER,
    ['file_json', 'memory'],
    'file_json',
  ),
  corneropsPersistenceRoot:
    process.env.CORNEROPS_PERSISTENCE_ROOT || './.cornerops/state',
  corneropsBackupRoot:
    process.env.CORNEROPS_BACKUP_ROOT || './.cornerops/backups',
  corneropsPersistenceFailClosed:
    process.env.CORNEROPS_PERSISTENCE_FAIL_CLOSED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_PERSISTENCE_FAIL_CLOSED),
  corneropsApprovalStoreProvider: parseEnum(
    process.env.CORNEROPS_APPROVAL_STORE_PROVIDER,
    ['file_json', 'memory'],
    'file_json',
  ),
  corneropsAuditStoreProvider: parseEnum(
    process.env.CORNEROPS_AUDIT_STORE_PROVIDER,
    ['file_json', 'memory'],
    'file_json',
  ),
  corneropsSessionStoreProvider: parseEnum(
    process.env.CORNEROPS_SESSION_STORE_PROVIDER,
    ['file_json', 'memory'],
    'file_json',
  ),
  corneropsFileStoreAtomicWrites:
    process.env.CORNEROPS_FILE_STORE_ATOMIC_WRITES === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_FILE_STORE_ATOMIC_WRITES),
  corneropsFileStoreMaxBytes: parseInteger(
    process.env.CORNEROPS_FILE_STORE_MAX_BYTES,
    5 * 1024 * 1024,
    { min: 1024, max: 100 * 1024 * 1024 },
  ),
  corneropsControlledActionsEnabled: parseBoolean(
    process.env.CORNEROPS_CONTROLLED_ACTIONS_ENABLED,
  ),
  corneropsControlledActionsDryRun:
    process.env.CORNEROPS_CONTROLLED_ACTIONS_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CONTROLLED_ACTIONS_DRY_RUN),
  corneropsControlledActionsRequireApproval:
    process.env.CORNEROPS_CONTROLLED_ACTIONS_REQUIRE_APPROVAL === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CONTROLLED_ACTIONS_REQUIRE_APPROVAL),
  corneropsControlledActionsFailClosed:
    process.env.CORNEROPS_CONTROLLED_ACTIONS_FAIL_CLOSED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CONTROLLED_ACTIONS_FAIL_CLOSED),
  corneropsActionGithubIssueCreateEnabled: parseBoolean(
    process.env.CORNEROPS_ACTION_GITHUB_ISSUE_CREATE_ENABLED,
  ),
  corneropsActionGithubIssueCreateDryRun:
    process.env.CORNEROPS_ACTION_GITHUB_ISSUE_CREATE_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_ACTION_GITHUB_ISSUE_CREATE_DRY_RUN),
  corneropsActionGithubIssueCreateRequireApproval:
    process.env.CORNEROPS_ACTION_GITHUB_ISSUE_CREATE_REQUIRE_APPROVAL === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_ACTION_GITHUB_ISSUE_CREATE_REQUIRE_APPROVAL),
  corneropsActionInternalNoteCreateEnabled: parseBoolean(
    process.env.CORNEROPS_ACTION_INTERNAL_NOTE_CREATE_ENABLED,
  ),
  corneropsActionInternalNoteCreateDryRun:
    process.env.CORNEROPS_ACTION_INTERNAL_NOTE_CREATE_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_ACTION_INTERNAL_NOTE_CREATE_DRY_RUN),
  corneropsActionInternalTaskCreateEnabled: parseBoolean(
    process.env.CORNEROPS_ACTION_INTERNAL_TASK_CREATE_ENABLED,
  ),
  corneropsActionInternalTaskCreateDryRun:
    process.env.CORNEROPS_ACTION_INTERNAL_TASK_CREATE_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_ACTION_INTERNAL_TASK_CREATE_DRY_RUN),
  corneropsAllowLocalInternalWrites: parseBoolean(
    process.env.CORNEROPS_ALLOW_LOCAL_INTERNAL_WRITES,
  ),
  corneropsReplayProtectionEnabled:
    process.env.CORNEROPS_REPLAY_PROTECTION_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_REPLAY_PROTECTION_ENABLED),
  corneropsReplayStoreProvider: parseEnum(
    process.env.CORNEROPS_REPLAY_STORE_PROVIDER,
    ['file', 'file_json', 'memory'],
    'file_json',
  ),
  corneropsReplayStorePath:
    process.env.CORNEROPS_REPLAY_STORE_PATH || './.cornerops/security/replay-store.json',
  corneropsReplayTtlSeconds: parseInteger(
    process.env.CORNEROPS_REPLAY_TTL_SECONDS,
    86400,
    { min: 60, max: 2592000 },
  ),
  corneropsReplayFailClosed:
    process.env.CORNEROPS_REPLAY_FAIL_CLOSED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_REPLAY_FAIL_CLOSED),
  corneropsRejectionStoreEnabled:
    process.env.CORNEROPS_REJECTION_STORE_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_REJECTION_STORE_ENABLED),
  corneropsRejectionStoreProvider: parseEnum(
    process.env.CORNEROPS_REJECTION_STORE_PROVIDER,
    ['file', 'file_json', 'memory'],
    'file_json',
  ),
  corneropsRejectionStorePath:
    process.env.CORNEROPS_REJECTION_STORE_PATH || './.cornerops/security/rejections.json',
  corneropsRejectionRetentionDays: parseInteger(
    process.env.CORNEROPS_REJECTION_RETENTION_DAYS,
    30,
    { min: 1, max: 365 },
  ),
  corneropsRateLimitingEnabled:
    process.env.CORNEROPS_RATE_LIMITING_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_RATE_LIMITING_ENABLED),
  corneropsRateLimitStoreProvider: parseEnum(
    process.env.CORNEROPS_RATE_LIMIT_STORE_PROVIDER,
    ['file', 'file_json', 'memory'],
    'file_json',
  ),
  corneropsOperatorRateLimitPerMinute: parseInteger(
    process.env.CORNEROPS_OPERATOR_RATE_LIMIT_PER_MINUTE,
    12,
    { min: 1, max: 600 },
  ),
  corneropsOperatorRateLimitBurst: parseInteger(
    process.env.CORNEROPS_OPERATOR_RATE_LIMIT_BURST,
    20,
    { min: 1, max: 1000 },
  ),
  corneropsRateLimitStorePath:
    process.env.CORNEROPS_RATE_LIMIT_STORE_PATH || './.cornerops/security/rate-limits.json',
  slackOperatorEnabled: parseBoolean(process.env.SLACK_OPERATOR_ENABLED),
  slackOperatorBotToken: process.env.SLACK_OPERATOR_BOT_TOKEN || '',
  slackOperatorSigningSecret: process.env.SLACK_OPERATOR_SIGNING_SECRET || '',
  slackOperatorAllowedChannelIds: parseCsv(process.env.SLACK_OPERATOR_ALLOWED_CHANNEL_IDS),
  slackOperatorAllowedUserIds: parseCsv(process.env.SLACK_OPERATOR_ALLOWED_USER_IDS),
  slackOperatorDryRun:
    process.env.SLACK_OPERATOR_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.SLACK_OPERATOR_DRY_RUN),
  corneropsBusinessDataEnabled: parseBoolean(
    process.env.CORNEROPS_BUSINESS_DATA_ENABLED,
  ),
  corneropsBusinessDataMode: parseEnum(
    process.env.CORNEROPS_BUSINESS_DATA_MODE,
    ['read_only'],
    'read_only',
  ),
  corneropsBusinessDataDryRun:
    process.env.CORNEROPS_BUSINESS_DATA_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_BUSINESS_DATA_DRY_RUN),
  corneropsBusinessDataRequireApproval:
    process.env.CORNEROPS_BUSINESS_DATA_REQUIRE_APPROVAL === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_BUSINESS_DATA_REQUIRE_APPROVAL),
  corneropsQaMode:
    process.env.CORNEROPS_QA_MODE === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_QA_MODE),
  corneropsControlTowerEnabled:
    process.env.CORNEROPS_CONTROL_TOWER_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CONTROL_TOWER_ENABLED),
  corneropsControlTowerMode: parseEnum(
    process.env.CORNEROPS_CONTROL_TOWER_MODE,
    ['beta', 'standard'],
    'beta',
  ),
  corneropsControlTowerRequireAuth: parseBoolean(
    process.env.CORNEROPS_CONTROL_TOWER_REQUIRE_AUTH,
  ),
  corneropsWebConsoleEnabled: parseBoolean(process.env.CORNEROPS_WEB_CONSOLE_ENABLED),
  corneropsWebConsoleMode: parseEnum(
    process.env.CORNEROPS_WEB_CONSOLE_MODE,
    ['local'],
    'local',
  ),
  corneropsWebConsoleRequireAuth:
    process.env.CORNEROPS_WEB_CONSOLE_REQUIRE_AUTH === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_WEB_CONSOLE_REQUIRE_AUTH),
  corneropsWebConsoleAuthToken: process.env.CORNEROPS_WEB_CONSOLE_AUTH_TOKEN || '',
  corneropsWebConsoleAllowedOrigins: parseCsv(
    process.env.CORNEROPS_WEB_CONSOLE_ALLOWED_ORIGINS
      || 'http://localhost:3000,http://127.0.0.1:3000',
  ),
  corneropsWebConsoleLocalOnly:
    process.env.CORNEROPS_WEB_CONSOLE_LOCAL_ONLY === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_WEB_CONSOLE_LOCAL_ONLY),
  corneropsWebConsoleReadOnly:
    process.env.CORNEROPS_WEB_CONSOLE_READ_ONLY === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_WEB_CONSOLE_READ_ONLY),
  corneropsWebConsoleDryRun:
    process.env.CORNEROPS_WEB_CONSOLE_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_WEB_CONSOLE_DRY_RUN),
  controlTowerFrontendApiEnabled: parseBoolean(process.env.CONTROL_TOWER_FRONTEND_API_ENABLED),
  controlTowerFrontendAuthRequired:
    process.env.CONTROL_TOWER_FRONTEND_AUTH_REQUIRED === undefined
      ? true
      : parseBoolean(process.env.CONTROL_TOWER_FRONTEND_AUTH_REQUIRED),
  controlTowerFrontendAuthMode: parseEnum(
    process.env.CONTROL_TOWER_FRONTEND_AUTH_MODE,
    ['operator_token'],
    'operator_token',
  ),
  controlTowerFrontendTokenHash: process.env.CONTROL_TOWER_FRONTEND_TOKEN_HASH || '',
  controlTowerFounderActionTokenHash:
    process.env.CONTROL_TOWER_FOUNDER_ACTION_TOKEN_HASH || '',
  controlTowerFounderActionAuthRequired:
    process.env.CONTROL_TOWER_FOUNDER_ACTION_AUTH_REQUIRED === undefined
      ? true
      : parseBoolean(process.env.CONTROL_TOWER_FOUNDER_ACTION_AUTH_REQUIRED),
  controlTowerFounderActionRateLimitPerMinute: parseInteger(
    process.env.CONTROL_TOWER_FOUNDER_ACTION_RATE_LIMIT_PER_MINUTE,
    10,
    { min: 1, max: 120 },
  ),
  controlTowerFrontendAllowedOrigins: parseCsv(process.env.CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS),
  controlTowerFrontendAllowLocalhost:
    process.env.CONTROL_TOWER_FRONTEND_ALLOW_LOCALHOST === undefined
      ? true
      : parseBoolean(process.env.CONTROL_TOWER_FRONTEND_ALLOW_LOCALHOST),
  controlTowerFrontendReadOnly:
    process.env.CONTROL_TOWER_FRONTEND_READ_ONLY === undefined
      ? true
      : parseBoolean(process.env.CONTROL_TOWER_FRONTEND_READ_ONLY),
  controlTowerFrontendFailClosed:
    process.env.CONTROL_TOWER_FRONTEND_FAIL_CLOSED === undefined
      ? true
      : parseBoolean(process.env.CONTROL_TOWER_FRONTEND_FAIL_CLOSED),
  controlTowerFrontendMaxPayloadKb: parseInteger(
    process.env.CONTROL_TOWER_FRONTEND_MAX_PAYLOAD_KB,
    256,
    { min: 16, max: 1024 },
  ),
  controlTowerFrontendRequestTimeoutMs: parseInteger(
    process.env.CONTROL_TOWER_FRONTEND_REQUEST_TIMEOUT_MS,
    8000,
    { min: 500, max: 60000 },
  ),
  controlTowerFrontendRateLimitPerMinute: parseInteger(
    process.env.CONTROL_TOWER_FRONTEND_RATE_LIMIT_PER_MINUTE,
    60,
    { min: 1, max: 10000 },
  ),
  controlTowerFrontendAuditRequests:
    process.env.CONTROL_TOWER_FRONTEND_AUDIT_REQUESTS === undefined
      ? true
      : parseBoolean(process.env.CONTROL_TOWER_FRONTEND_AUDIT_REQUESTS),
  controlTowerFrontendMaskPii:
    process.env.CONTROL_TOWER_FRONTEND_MASK_PII === undefined
      ? true
      : parseBoolean(process.env.CONTROL_TOWER_FRONTEND_MASK_PII),
  corneropsApprovalCenterEnabled:
    process.env.CORNEROPS_APPROVAL_CENTER_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_APPROVAL_CENTER_ENABLED),
  corneropsApprovalCenterDryRun:
    process.env.CORNEROPS_APPROVAL_CENTER_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_APPROVAL_CENTER_DRY_RUN),
  corneropsApprovalCenterAllowRealExecution: parseBoolean(
    process.env.CORNEROPS_APPROVAL_CENTER_ALLOW_REAL_EXECUTION,
  ),
  corneropsOperatorWebAskEnabled:
    process.env.CORNEROPS_OPERATOR_WEB_ASK_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_WEB_ASK_ENABLED),
  corneropsOperatorWebAskDryRun:
    process.env.CORNEROPS_OPERATOR_WEB_ASK_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_OPERATOR_WEB_ASK_DRY_RUN),
  corneropsOperatorWebAskMaxChars: parseInteger(
    process.env.CORNEROPS_OPERATOR_WEB_ASK_MAX_CHARS,
    12000,
    { min: 1000, max: 50000 },
  ),
  corneropsAuditViewerEnabled:
    process.env.CORNEROPS_AUDIT_VIEWER_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_AUDIT_VIEWER_ENABLED),
  corneropsAuditViewerMaxEvents: parseInteger(
    process.env.CORNEROPS_AUDIT_VIEWER_MAX_EVENTS,
    100,
    { min: 1, max: 500 },
  ),
  corneropsAuditViewerMaskPii:
    process.env.CORNEROPS_AUDIT_VIEWER_MASK_PII === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_AUDIT_VIEWER_MASK_PII),
  corneropsSecurityDashboardEnabled:
    process.env.CORNEROPS_SECURITY_DASHBOARD_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_SECURITY_DASHBOARD_ENABLED),
  corneropsSecurityDashboardMaskPii:
    process.env.CORNEROPS_SECURITY_DASHBOARD_MASK_PII === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_SECURITY_DASHBOARD_MASK_PII),
  corneropsControlTowerWebRefreshSeconds: parseInteger(
    process.env.CORNEROPS_CONTROL_TOWER_WEB_REFRESH_SECONDS,
    30,
    { min: 5, max: 3600 },
  ),
  corneropsStrictSecurityMode:
    process.env.CORNEROPS_STRICT_SECURITY_MODE === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_STRICT_SECURITY_MODE),
  corneropsFailClosed:
    process.env.CORNEROPS_FAIL_CLOSED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_FAIL_CLOSED),
  corneropsRequireAuditForTools:
    process.env.CORNEROPS_REQUIRE_AUDIT_FOR_TOOLS === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_REQUIRE_AUDIT_FOR_TOOLS),
  corneropsRequireApprovalForWrites:
    process.env.CORNEROPS_REQUIRE_APPROVAL_FOR_WRITES === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_REQUIRE_APPROVAL_FOR_WRITES),
  corneropsRequireApprovalForExternalActions:
    process.env.CORNEROPS_REQUIRE_APPROVAL_FOR_EXTERNAL_ACTIONS === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_REQUIRE_APPROVAL_FOR_EXTERNAL_ACTIONS),
  corneropsPiiMasking:
    process.env.CORNEROPS_PII_MASKING === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_PII_MASKING),
  corneropsLogSanitization:
    process.env.CORNEROPS_LOG_SANITIZATION === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_LOG_SANITIZATION),
  corneropsMaxAuditPayloadBytes: parseInteger(
    process.env.CORNEROPS_MAX_AUDIT_PAYLOAD_BYTES,
    12000,
    { min: 1024, max: 100000 },
  ),
  corneropsRealSourceOnboardingEnabled: parseBoolean(
    process.env.CORNEROPS_REAL_SOURCE_ONBOARDING_ENABLED,
  ),
  corneropsFirstRealSourceEnabled: parseBoolean(
    process.env.CORNEROPS_FIRST_REAL_SOURCE_ENABLED,
  ),
  corneropsFirstRealSource: parseEnum(
    process.env.CORNEROPS_FIRST_REAL_SOURCE,
    ['auto', 'business_db', 'github', 'mock'],
    'auto',
  ),
  corneropsFirstRealSourceMode: parseEnum(
    process.env.CORNEROPS_FIRST_REAL_SOURCE_MODE,
    ['read_only'],
    'read_only',
  ),
  corneropsFirstRealSourceDryRun:
    process.env.CORNEROPS_FIRST_REAL_SOURCE_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_FIRST_REAL_SOURCE_DRY_RUN),
  corneropsPreferredRealSourceOrder: parseCsv(
    process.env.CORNEROPS_PREFERRED_REAL_SOURCE_ORDER || 'github,business_db',
  ),
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  whatsappWebhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || '',
  corneropsAgentsEnabled:
    process.env.CORNEROPS_AGENTS_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_AGENTS_ENABLED),
  corneropsAgentPackVersion:
    process.env.CORNEROPS_AGENT_PACK_VERSION || 'v0.1',
  corneropsDefaultAgent:
    process.env.CORNEROPS_DEFAULT_AGENT || 'cornerops-router-agent',
  corneropsDryRun:
    process.env.CORNEROPS_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_DRY_RUN),
  corneropsRequireApproval:
    process.env.CORNEROPS_REQUIRE_APPROVAL === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_REQUIRE_APPROVAL),
  corneropsAuditEnabled:
    process.env.CORNEROPS_AUDIT_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_AUDIT_ENABLED),
  corneropsAgentEnabledIds: parseCsv(process.env.CORNEROPS_AGENT_ENABLED_IDS),
  corneropsAgentDisabledIds: parseCsv(process.env.CORNEROPS_AGENT_DISABLED_IDS),
  corneropsAgentAllowedUsers: parseCsv(process.env.CORNEROPS_AGENT_ALLOWED_USERS),
  corneropsRealDataEnabled: parseBoolean(process.env.CORNEROPS_REAL_DATA_ENABLED),
  corneropsDataMode: parseEnum(
    process.env.CORNEROPS_DATA_MODE,
    ['mock', 'read_only', 'draft_only', 'approval_required', 'write_enabled'],
    'mock',
  ),
  corneropsAllowedDataSources: parseCsv(
    process.env.CORNEROPS_ALLOWED_DATA_SOURCES
      || 'leads,quotes,orders,github,audit_logs,approvals,agent_logs,sync_status',
  ),
  corneropsSyncEnabled: parseBoolean(process.env.CORNEROPS_SYNC_ENABLED),
  corneropsSyncIntervalMinutes: parseInteger(
    process.env.CORNEROPS_SYNC_INTERVAL_MINUTES,
    15,
    { min: 1, max: 1440 },
  ),
  corneropsDatabaseProvider: process.env.CORNEROPS_DATABASE_PROVIDER || '',
  corneropsInternalPersistenceEnabled: parseBoolean(
    process.env.CORNEROPS_INTERNAL_PERSISTENCE_ENABLED,
  ),
  corneropsInternalPersistenceProvider: parseEnum(
    process.env.CORNEROPS_INTERNAL_PERSISTENCE_PROVIDER,
    ['postgres'],
    'postgres',
  ),
  corneropsInternalDatabaseUrl: process.env.CORNEROPS_INTERNAL_DATABASE_URL || '',
  corneropsInternalDatabaseCaPath: process.env.CORNEROPS_INTERNAL_DATABASE_CA_PATH || '',
  corneropsInternalSchema: parseEnum(
    process.env.CORNEROPS_INTERNAL_SCHEMA,
    ['cornerops_internal'],
    'cornerops_internal',
  ),
  corneropsInternalStatementTimeoutMs: parseInteger(
    process.env.CORNEROPS_INTERNAL_STATEMENT_TIMEOUT_MS,
    8000,
    { min: 500, max: 30000 },
  ),
  supplyGraphEnabled: parseBoolean(process.env.SUPPLYGRAPH_ENABLED),
  supplyGraphIntermexSyncEnabled: parseBoolean(process.env.SUPPLYGRAPH_INTERMEX_SYNC_ENABLED),
  supplyGraphDemandIntakeEnabled: parseBoolean(process.env.SUPPLYGRAPH_DEMAND_INTAKE_ENABLED),
  supplyGraphMatchingEnabled: parseBoolean(process.env.SUPPLYGRAPH_MATCHING_ENABLED),
  supplyGraphMatchMaxCandidatesPerItem: parseInteger(
    process.env.SUPPLYGRAPH_MATCH_MAX_CANDIDATES_PER_ITEM,
    5,
    { min: 1, max: 10 },
  ),
  supplyGraphSupplierEvidenceEnabled: parseBoolean(process.env.SUPPLYGRAPH_SUPPLIER_EVIDENCE_ENABLED),
  supplyGraphEvidenceApplicationEnabled: parseBoolean(process.env.SUPPLYGRAPH_EVIDENCE_APPLICATION_ENABLED),
  supplyGraphAuthorizedSellersEnabled: parseBoolean(process.env.SUPPLYGRAPH_AUTHORIZED_SELLERS_ENABLED),
  supplyGraphWave1CatalogActivationEnabled: parseBoolean(process.env.SUPPLYGRAPH_WAVE1_CATALOG_ACTIVATION_ENABLED),
  supplyGraphSellerCaptureEnabled: parseBoolean(process.env.SUPPLYGRAPH_SELLER_CAPTURE_ENABLED),
  supplyGraphSellerOnboardingEnabled: parseBoolean(process.env.SUPPLYGRAPH_SELLER_ONBOARDING_ENABLED),
  supplyGraphSellerOnboardingApplicationEnabled: parseBoolean(process.env.SUPPLYGRAPH_SELLER_ONBOARDING_APPLICATION_ENABLED),
  supplyGraphSellerMediaEnabled: parseBoolean(process.env.SUPPLYGRAPH_SELLER_MEDIA_ENABLED),
  supplyGraphSellerInventoryEnabled: parseBoolean(process.env.SUPPLYGRAPH_SELLER_INVENTORY_ENABLED),
  supplyGraphMultiSellerComparisonEnabled: parseBoolean(process.env.SUPPLYGRAPH_MULTI_SELLER_COMPARISON_ENABLED),
  supplyGraphInitialProductStock: parseInteger(process.env.SUPPLYGRAPH_INITIAL_PRODUCT_STOCK, 100, { min: 0, max: 100000 }),
  supplyGraphMaxProductsPerSeller: parseInteger(process.env.SUPPLYGRAPH_MAX_PRODUCTS_PER_SELLER, 250, { min: 1, max: 250 }),
  supplyGraphMaxTotalProducts: parseInteger(process.env.SUPPLYGRAPH_MAX_TOTAL_WAVE1_PRODUCTS || process.env.SUPPLYGRAPH_MAX_TOTAL_PRODUCTS, 1500, { min: 1, max: 2000 }),
  supplyGraphMaxImagesPerProduct: parseInteger(process.env.SUPPLYGRAPH_MAX_IMAGES_PER_PRODUCT, 3, { min: 0, max: 3 }),
  supplyGraphComparisonMaxSellers: parseInteger(process.env.SUPPLYGRAPH_COMPARISON_MAX_SELLERS, 32, { min: 1, max: 32 }),
  corneropsFrontendServeEnabled: parseBoolean(process.env.CORNEROPS_FRONTEND_SERVE_ENABLED),
  corneropsUnifiedCommandCenterEnabled: parseBoolean(process.env.CORNEROPS_UNIFIED_COMMAND_CENTER_ENABLED),
  corneropsLiveOverviewEnabled: parseBoolean(process.env.CORNEROPS_LIVE_OVERVIEW_ENABLED),
  corneropsMarketingFoundationEnabled: parseBoolean(process.env.CORNEROPS_MARKETING_FOUNDATION_ENABLED),
  corneropsCapabilityStatusEnabled: parseBoolean(process.env.CORNEROPS_CAPABILITY_STATUS_ENABLED),
  supplyGraphEvidenceMaxFactsPerPackage: parseInteger(
    process.env.SUPPLYGRAPH_EVIDENCE_MAX_FACTS_PER_PACKAGE, 100, { min: 1, max: 500 },
  ),
  supplyGraphEvidenceExpiringSoonHours: parseInteger(
    process.env.SUPPLYGRAPH_EVIDENCE_EXPIRING_SOON_HOURS, 72, { min: 1, max: 720 },
  ),
  supplyGraphObservationStaleAfterHours: parseInteger(
    process.env.SUPPLYGRAPH_OBSERVATION_STALE_AFTER_HOURS,
    168,
    { min: 1, max: 8760 },
  ),
  supplyGraphIntermexSourcePath:
    process.env.SUPPLYGRAPH_INTERMEX_SOURCE_PATH
    || 'docs/data/cornermex-products-master-enriched-from-intermex.csv',
  supplyGraphIntermexSourceChecksum:
    process.env.SUPPLYGRAPH_INTERMEX_SOURCE_CHECKSUM
    || '90f8585196507fbe3663586d5a902449828d67b52ca7db436dd06867c13f1934',
  databaseUrl: process.env.DATABASE_URL || '',
  readOnlyDatabaseUrl: process.env.READONLY_DATABASE_URL || '',
  supabaseReadonlyKey: process.env.SUPABASE_READONLY_KEY || '',
  supabaseSchema: process.env.SUPABASE_SCHEMA || 'public',
  corneropsDbReadOnly:
    process.env.CORNEROPS_DB_READ_ONLY === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_DB_READ_ONLY),
  corneropsDbAllowWrites: parseBoolean(process.env.CORNEROPS_DB_ALLOW_WRITES),
  corneropsDbSchemaDiscoveryEnabled: parseBoolean(
    process.env.CORNEROPS_DB_SCHEMA_DISCOVERY_ENABLED,
  ),
  corneropsDbQueryTimeoutMs: parseInteger(
    process.env.CORNEROPS_DB_QUERY_TIMEOUT_MS,
    10000,
    { min: 100, max: 30000 },
  ),
  corneropsDbMaxRows: parseInteger(
    process.env.CORNEROPS_DB_MAX_ROWS,
    100,
    { min: 1, max: 1000 },
  ),
  corneropsDbAuditReads:
    process.env.CORNEROPS_DB_AUDIT_READS === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_DB_AUDIT_READS),
  corneropsDbPiiMasking:
    process.env.CORNEROPS_DB_PII_MASKING === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_DB_PII_MASKING),
  cornermexLovableEnabled: parseBoolean(process.env.CORNERMEX_LOVABLE_ENABLED),
  cornermexLovableDiscoveryMode: parseEnum(
    process.env.CORNERMEX_LOVABLE_DISCOVERY_MODE,
    ['mock', 'repo', 'supabase', 'auto'],
    'mock',
  ),
  cornermexLovableReadOnly:
    process.env.CORNERMEX_LOVABLE_READ_ONLY === undefined
      ? true
      : parseBoolean(process.env.CORNERMEX_LOVABLE_READ_ONLY),
  cornermexLovableDryRun:
    process.env.CORNERMEX_LOVABLE_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNERMEX_LOVABLE_DRY_RUN),
  cornermexLovableProjectUrl: process.env.CORNERMEX_LOVABLE_PROJECT_URL || '',
  cornermexLovableProjectName: process.env.CORNERMEX_LOVABLE_PROJECT_NAME || '',
  cornermexLovableGithubRepo: process.env.CORNERMEX_LOVABLE_GITHUB_REPO || '',
  cornermexLovableDeploymentUrl: process.env.CORNERMEX_LOVABLE_DEPLOYMENT_URL || '',
  cornermexOperatingStage: parseEnum(
    process.env.CORNERMEX_OPERATING_STAGE,
    ['pre_launch', 'soft_launch', 'live', 'paused'],
    'live',
  ),
  cornermexLaunchDate: process.env.CORNERMEX_LAUNCH_DATE || '',
  cornermexExpectedProductCount: parseInteger(
    process.env.CORNERMEX_EXPECTED_PRODUCT_COUNT,
    0,
    { min: 0, max: 100000 },
  ),
  cornermexSupabaseEnabled: parseBoolean(process.env.CORNERMEX_SUPABASE_ENABLED),
  cornermexSupabaseUrl: process.env.CORNERMEX_SUPABASE_URL || '',
  cornermexSupabaseAnonKey: process.env.CORNERMEX_SUPABASE_ANON_KEY || '',
  cornermexSupabaseSchema: process.env.CORNERMEX_SUPABASE_SCHEMA || 'public',
  cornermexSupabaseReadOnly:
    process.env.CORNERMEX_SUPABASE_READ_ONLY === undefined
      ? true
      : parseBoolean(process.env.CORNERMEX_SUPABASE_READ_ONLY),
  cornermexSupabaseAllowWrites: parseBoolean(process.env.CORNERMEX_SUPABASE_ALLOW_WRITES),
  cornermexSupabaseSchemaDiscoveryEnabled: parseBoolean(process.env.CORNERMEX_SUPABASE_SCHEMA_DISCOVERY_ENABLED),
  cornermexSupabaseAuditReads:
    process.env.CORNERMEX_SUPABASE_AUDIT_READS === undefined
      ? true
      : parseBoolean(process.env.CORNERMEX_SUPABASE_AUDIT_READS),
  cornermexSupabasePiiMasking:
    process.env.CORNERMEX_SUPABASE_PII_MASKING === undefined
      ? true
      : parseBoolean(process.env.CORNERMEX_SUPABASE_PII_MASKING),
  cornermexSupabaseBlockMutations:
    process.env.CORNERMEX_SUPABASE_BLOCK_MUTATIONS === undefined
      ? true
      : parseBoolean(process.env.CORNERMEX_SUPABASE_BLOCK_MUTATIONS),
  cornermexSupabaseServiceRoleKeyBlocked:
    process.env.CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED === undefined
      ? true
      : parseBoolean(process.env.CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED),
  cornermexSupabaseMaxRows: parseInteger(
    process.env.CORNERMEX_SUPABASE_MAX_ROWS,
    50,
    { min: 1, max: 1000 },
  ),
  cornermexSupabaseQueryTimeoutMs: parseInteger(
    process.env.CORNERMEX_SUPABASE_QUERY_TIMEOUT_MS,
    10000,
    { min: 100, max: 30000 },
  ),
  cornermexSupabaseRequestTimeoutMs: parseInteger(
    process.env.CORNERMEX_SUPABASE_REQUEST_TIMEOUT_MS || process.env.CORNERMEX_SUPABASE_QUERY_TIMEOUT_MS,
    8000,
    { min: 100, max: 30000 },
  ),
  cornermexSupabaseMaskPii:
    process.env.CORNERMEX_SUPABASE_MASK_PII === undefined
      ? true
      : parseBoolean(process.env.CORNERMEX_SUPABASE_MASK_PII),
  cornermexSupabaseFailClosed:
    process.env.CORNERMEX_SUPABASE_FAIL_CLOSED === undefined
      ? true
      : parseBoolean(process.env.CORNERMEX_SUPABASE_FAIL_CLOSED),
  cornermexSupabaseTableMapJson: process.env.CORNERMEX_SUPABASE_TABLE_MAP_JSON || '',
  cornermexSupabaseProductsTable: process.env.CORNERMEX_SUPABASE_PRODUCTS_TABLE || '',
  cornermexSupabaseLeadsTable: process.env.CORNERMEX_SUPABASE_LEADS_TABLE || '',
  cornermexSupabaseQuotesTable: process.env.CORNERMEX_SUPABASE_QUOTES_TABLE || '',
  cornermexSupabaseOrdersTable: process.env.CORNERMEX_SUPABASE_ORDERS_TABLE || '',
  cornermexSupabaseCustomersTable: process.env.CORNERMEX_SUPABASE_CUSTOMERS_TABLE || '',
  cornermexSupabasePaymentsTable: process.env.CORNERMEX_SUPABASE_PAYMENTS_TABLE || '',
  cornermexSupabaseFulfillmentTable: process.env.CORNERMEX_SUPABASE_FULFILLMENT_TABLE || '',
  corneropsCornermexConnectorEnabled: parseBoolean(process.env.CORNEROPS_CORNERMEX_CONNECTOR_ENABLED),
  corneropsCornermexConnectorMode: parseEnum(
    process.env.CORNEROPS_CORNERMEX_CONNECTOR_MODE,
    ['mock', 'repo_discovered', 'schema_discovered', 'real_read_only', 'real_read_only_partial', 'blocked_unsafe_config'],
    'mock',
  ),
  corneropsCornermexConnectorAuditReads:
    process.env.CORNEROPS_CORNERMEX_CONNECTOR_AUDIT_READS === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CORNERMEX_CONNECTOR_AUDIT_READS),
  corneropsCornermexConnectorPiiMasking:
    process.env.CORNEROPS_CORNERMEX_CONNECTOR_PII_MASKING === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CORNERMEX_CONNECTOR_PII_MASKING),
  openclawEnabled: parseBoolean(process.env.OPENCLAW_ENABLED),
  openclawOperatorChannelEnabled: parseBoolean(
    process.env.OPENCLAW_OPERATOR_CHANNEL_ENABLED,
  ),
  openclawOperatorChannelDryRun:
    process.env.OPENCLAW_OPERATOR_CHANNEL_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.OPENCLAW_OPERATOR_CHANNEL_DRY_RUN),
  openclawOperatorChannelProvider: parseEnum(
    process.env.OPENCLAW_OPERATOR_CHANNEL_PROVIDER,
    ['mock', 'telegram', 'slack'],
    'mock',
  ),
  openclawOperatorChannelAllowlistOnly:
    process.env.OPENCLAW_OPERATOR_CHANNEL_ALLOWLIST_ONLY === undefined
      ? true
      : parseBoolean(process.env.OPENCLAW_OPERATOR_CHANNEL_ALLOWLIST_ONLY),
  openclawBaseUrl:
    process.env.OPENCLAW_BASE_URL || 'http://127.0.0.1:18789',
  openclawGatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN || '',
  openclawGatewayPassword: process.env.OPENCLAW_GATEWAY_PASSWORD || '',
  openclawDefaultModel:
    process.env.OPENCLAW_DEFAULT_MODEL || 'openclaw/default',
  openclawTimeoutMs: parseInteger(process.env.OPENCLAW_TIMEOUT_MS, 30000, {
    min: 1000,
    max: 120000,
  }),
  openclawMaxRetries: parseInteger(process.env.OPENCLAW_MAX_RETRIES, 2, {
    min: 0,
    max: 5,
  }),
  openclawDryRun:
    process.env.OPENCLAW_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.OPENCLAW_DRY_RUN),
  openclawRequireApproval:
    process.env.OPENCLAW_REQUIRE_APPROVAL === undefined
      ? true
      : parseBoolean(process.env.OPENCLAW_REQUIRE_APPROVAL),
  openclawAuditEnabled:
    process.env.OPENCLAW_AUDIT_ENABLED === undefined
      ? true
      : parseBoolean(process.env.OPENCLAW_AUDIT_ENABLED),
  openclawSandboxMode: process.env.OPENCLAW_SANDBOX_MODE || 'non-main',
  openclawAllowedChannels: parseCsv(
    process.env.OPENCLAW_ALLOWED_CHANNELS || 'whatsapp,telegram,slack',
  ),
  openclawAllowedUsers: parseCsv(process.env.OPENCLAW_ALLOWED_USERS),
  openclawAllowedTools: parseCsv(process.env.OPENCLAW_ALLOWED_TOOLS),
  githubEnabled: parseBoolean(process.env.GITHUB_ENABLED),
  githubReadOnly:
    process.env.GITHUB_READ_ONLY === undefined
      ? true
      : parseBoolean(process.env.GITHUB_READ_ONLY),
  githubDryRun:
    process.env.GITHUB_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.GITHUB_DRY_RUN),
  githubToken: process.env.GITHUB_TOKEN || '',
  githubOwner: process.env.GITHUB_OWNER || '',
  githubRepo: process.env.GITHUB_REPO || 'cornerops-ai',
  githubAllowedIssueLabels: parseCsv(process.env.GITHUB_ALLOWED_ISSUE_LABELS),
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
  githubApiVersion: parseEnum(
    process.env.GITHUB_API_VERSION,
    ['2022-11-28'],
    '2022-11-28',
  ),
  githubAllowIssueCreation: parseBoolean(process.env.GITHUB_ALLOW_ISSUE_CREATION),
  githubAllowPrWrite: parseBoolean(process.env.GITHUB_ALLOW_PR_WRITE),
  githubAllowWorkflowTrigger: parseBoolean(process.env.GITHUB_ALLOW_WORKFLOW_TRIGGER),
  corneropsGithubRealReadOnlyEnabled: parseBoolean(
    process.env.CORNEROPS_GITHUB_REAL_READ_ONLY_ENABLED,
  ),
  corneropsGithubAuditReads:
    process.env.CORNEROPS_GITHUB_AUDIT_READS === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_GITHUB_AUDIT_READS),
  openclawEcosystemEnabled: parseBoolean(process.env.OPENCLAW_ECOSYSTEM_ENABLED),
  craboxEnabled: parseBoolean(process.env.CRABOX_ENABLED),
  craboxDryRun:
    process.env.CRABOX_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CRABOX_DRY_RUN),
  octopoolEnabled: parseBoolean(process.env.OCTOPOOL_ENABLED),
  octopoolDryRun:
    process.env.OCTOPOOL_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.OCTOPOOL_DRY_RUN),
  clawhubEnabled: parseBoolean(process.env.CLAWHUB_ENABLED),
  clawhubReadOnly:
    process.env.CLAWHUB_READ_ONLY === undefined
      ? true
      : parseBoolean(process.env.CLAWHUB_READ_ONLY),
  clawhubAllowlistOnly:
    process.env.CLAWHUB_ALLOWLIST_ONLY === undefined
      ? true
      : parseBoolean(process.env.CLAWHUB_ALLOWLIST_ONLY),
  lobsterEnabled: parseBoolean(process.env.LOBSTER_ENABLED),
  lobsterDryRun:
    process.env.LOBSTER_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.LOBSTER_DRY_RUN),
  clawsweeperEnabled: parseBoolean(process.env.CLAWSWEEPER_ENABLED),
  clawsweeperDryRun:
    process.env.CLAWSWEEPER_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CLAWSWEEPER_DRY_RUN),
  crabfleetEnabled: parseBoolean(process.env.CRABFLEET_ENABLED),
  crabfleetDryRun:
    process.env.CRABFLEET_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CRABFLEET_DRY_RUN),
  clickclackEnabled: parseBoolean(process.env.CLICKCLACK_ENABLED),
  clickclackDryRun:
    process.env.CLICKCLACK_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CLICKCLACK_DRY_RUN),
  corneropsContextLayerEnabled: parseBoolean(process.env.CORNEROPS_CONTEXT_LAYER_ENABLED),
  corneropsContextMode: parseEnum(
    process.env.CORNEROPS_CONTEXT_MODE,
    ['mock', 'read_only', 'sync_allowed', 'disabled'],
    'mock',
  ),
  corneropsContextDryRun:
    process.env.CORNEROPS_CONTEXT_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CONTEXT_DRY_RUN),
  corneropsContextReadOnly:
    process.env.CORNEROPS_CONTEXT_READ_ONLY === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CONTEXT_READ_ONLY),
  corneropsContextRequireApproval:
    process.env.CORNEROPS_CONTEXT_REQUIRE_APPROVAL === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CONTEXT_REQUIRE_APPROVAL),
  corneropsContextAuditEnabled:
    process.env.CORNEROPS_CONTEXT_AUDIT_ENABLED === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CONTEXT_AUDIT_ENABLED),
  corneropsLocalArchivesEnabled: parseBoolean(process.env.CORNEROPS_LOCAL_ARCHIVES_ENABLED),
  corneropsLocalArchivesPath: process.env.CORNEROPS_LOCAL_ARCHIVES_PATH || './.cornerops/archives',
  corneropsLocalArchivesDb: process.env.CORNEROPS_LOCAL_ARCHIVES_DB || './.cornerops/archives/context.sqlite',
  corneropsContextRetentionDays: parseInteger(process.env.CORNEROPS_CONTEXT_RETENTION_DAYS, 180, {
    min: 1,
    max: 3650,
  }),
  corneropsContextPiiMasking:
    process.env.CORNEROPS_CONTEXT_PII_MASKING === undefined
      ? true
      : parseBoolean(process.env.CORNEROPS_CONTEXT_PII_MASKING),
  corneropsContextMaxResults: parseInteger(process.env.CORNEROPS_CONTEXT_MAX_RESULTS, 20, {
    min: 1,
    max: 100,
  }),
  crawlersEnabled: parseBoolean(process.env.CRAWLERS_ENABLED),
  gitcrawlEnabled: parseBoolean(process.env.GITCRAWL_ENABLED),
  slacrawlEnabled: parseBoolean(process.env.SLACRAWL_ENABLED),
  wacrawlEnabled: parseBoolean(process.env.WACRAWL_ENABLED),
  notcrawlEnabled: parseBoolean(process.env.NOTCRAWL_ENABLED),
  telecrawlEnabled: parseBoolean(process.env.TELECRAWL_ENABLED),
  discrawlEnabled: parseBoolean(process.env.DISCRAWL_ENABLED),
  graincrawlEnabled: parseBoolean(process.env.GRAINCrawl_ENABLED || process.env.GRAINCRAWL_ENABLED),
  imsgcrawlEnabled: parseBoolean(process.env.IMSGCRAWL_ENABLED),
  photoscrawlEnabled: parseBoolean(process.env.PHOTOSCRAWL_ENABLED),
  gitcrawlDryRun:
    process.env.GITCRAWL_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.GITCRAWL_DRY_RUN),
  slacrawlDryRun:
    process.env.SLACRAWL_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.SLACRAWL_DRY_RUN),
  wacrawlDryRun:
    process.env.WACRAWL_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.WACRAWL_DRY_RUN),
  notcrawlDryRun:
    process.env.NOTCRAWL_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.NOTCRAWL_DRY_RUN),
  telecrawlDryRun:
    process.env.TELECRAWL_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.TELECRAWL_DRY_RUN),
  discrawlDryRun:
    process.env.DISCRAWL_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.DISCRAWL_DRY_RUN),
  githubContextEnabled: parseBoolean(process.env.GITHUB_CONTEXT_ENABLED),
  slackContextEnabled: parseBoolean(process.env.SLACK_CONTEXT_ENABLED),
  whatsappContextEnabled: parseBoolean(process.env.WHATSAPP_CONTEXT_ENABLED),
  telegramContextEnabled: parseBoolean(process.env.TELEGRAM_CONTEXT_ENABLED),
  notionContextEnabled: parseBoolean(process.env.NOTION_CONTEXT_ENABLED),
  googleWorkspaceContextEnabled: parseBoolean(process.env.GOOGLE_WORKSPACE_CONTEXT_ENABLED),
  mcporterEnabled: parseBoolean(process.env.MCPORTER_ENABLED),
  mcporterDryRun:
    process.env.MCPORTER_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.MCPORTER_DRY_RUN),
  acpEnabled: parseBoolean(process.env.ACP_ENABLED),
  acpDryRun:
    process.env.ACP_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.ACP_DRY_RUN),
  pluginInspectorEnabled: parseBoolean(process.env.PLUGIN_INSPECTOR_ENABLED),
  clawbenchEnabled: parseBoolean(process.env.CLAWBENCH_ENABLED),
  clawbenchDryRun:
    process.env.CLAWBENCH_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CLAWBENCH_DRY_RUN),
  clawpatchEnabled: parseBoolean(process.env.CLAWPATCH_ENABLED),
  clawpatchDryRun:
    process.env.CLAWPATCH_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.CLAWPATCH_DRY_RUN),
  fsSafeEnabled:
    process.env.FS_SAFE_ENABLED === undefined
      ? true
      : parseBoolean(process.env.FS_SAFE_ENABLED),
  clawsafeRoot: process.env.CLAWSAFE_ROOT || './.cornerops',
  clawsafeAllowOutsideRoot: parseBoolean(process.env.CLAWSAFE_ALLOW_OUTSIDE_ROOT),
  gogcliEnabled: parseBoolean(process.env.GOGCLI_ENABLED),
  gogcliDryRun:
    process.env.GOGCLI_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.GOGCLI_DRY_RUN),
  wacliEnabled: parseBoolean(process.env.WACLI_ENABLED),
  wacliDryRun:
    process.env.WACLI_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.WACLI_DRY_RUN),
  goplacesEnabled: parseBoolean(process.env.GOPLACES_ENABLED),
  goplacesDryRun:
    process.env.GOPLACES_DRY_RUN === undefined
      ? true
      : parseBoolean(process.env.GOPLACES_DRY_RUN),
  clawpdfEnabled: parseBoolean(process.env.CLAWPDF_ENABLED),
  ffmpegWasmEnabled: parseBoolean(process.env.FFMPEG_WASM_ENABLED),
  rastermillEnabled: parseBoolean(process.env.RASTERMILL_ENABLED),
};

const getEnvWarnings = () => {
  const warnings = [];
  if (
    baseEnv.corneropsWebConsoleEnabled
    && baseEnv.corneropsWebConsoleLocalOnly
    && !['127.0.0.1', 'localhost', '::1'].includes(baseEnv.bindHost)
  ) {
    warnings.push('Local-only Control Tower is configured on a non-loopback bind host.');
  }
  if (baseEnv.useSupabase && !baseEnv.supabaseUrl) {
    warnings.push('USE_SUPABASE=true but SUPABASE_URL is missing; mock fallback will be used.');
  }
  if (
    baseEnv.useSupabase &&
    !baseEnv.supabaseAnonKey &&
    !baseEnv.supabaseServiceRoleKey
  ) {
    warnings.push('USE_SUPABASE=true but Supabase keys are missing; mock fallback will be used.');
  }
  if (
    baseEnv.nodeEnv !== 'test' &&
    !baseEnv.internalApiKey &&
    !baseEnv.allowInternalNoKey
  ) {
    warnings.push('INTERNAL_API_KEY is missing; internal endpoints will remain locked.');
  }
  if (baseEnv.openclawEnabled && baseEnv.openclawDryRun) {
    warnings.push('OPENCLAW_ENABLED=true while OPENCLAW_DRY_RUN=true; tool execution will remain simulated.');
  }
  if (baseEnv.corneropsAgentsEnabled && baseEnv.corneropsDryRun) {
    warnings.push('CORNEROPS_AGENTS_ENABLED=true while CORNEROPS_DRY_RUN=true; agent execution will remain simulated.');
  }
  if (!baseEnv.corneropsRequireApproval) {
    warnings.push('CORNEROPS_REQUIRE_APPROVAL=false; only use this in isolated tests.');
  }
  if (!baseEnv.corneropsFailClosed) {
    warnings.push('CORNEROPS_FAIL_CLOSED=false; unknown actions may not be safely denied.');
  }
  if (
    baseEnv.corneropsControlledActionsEnabled
    && (
      !baseEnv.corneropsControlledActionsRequireApproval
      || !baseEnv.corneropsControlledActionsFailClosed
      || !baseEnv.corneropsAuditEnabled
    )
  ) {
    warnings.push('Controlled actions require approval, audit and fail-closed mode.');
  }
  if (
    baseEnv.githubAllowIssueCreation
    && (
      !baseEnv.corneropsControlledActionsEnabled
      || !baseEnv.corneropsActionGithubIssueCreateEnabled
      || baseEnv.githubReadOnly
      || baseEnv.githubDryRun
      || baseEnv.corneropsControlledActionsDryRun
    )
  ) {
    warnings.push('GitHub issue creation is not fully enabled; real execution remains blocked.');
  }
  if (!baseEnv.corneropsPiiMasking || !baseEnv.corneropsLogSanitization) {
    warnings.push('PII masking or log sanitization is disabled.');
  }
  if (
    baseEnv.corneropsWebConsoleEnabled
    && (
      !baseEnv.corneropsWebConsoleLocalOnly
      || !baseEnv.corneropsWebConsoleReadOnly
      || !baseEnv.corneropsWebConsoleDryRun
      || !baseEnv.corneropsWebConsoleRequireAuth
      || !baseEnv.corneropsWebConsoleAuthToken
      || !baseEnv.corneropsPiiMasking
      || !baseEnv.corneropsLogSanitization
      || !baseEnv.corneropsAuditViewerMaskPii
      || !baseEnv.corneropsSecurityDashboardMaskPii
    )
  ) {
    warnings.push('Web console is enabled without all local-only, auth, read-only and dry-run controls.');
  }
  if (
    baseEnv.controlTowerFrontendApiEnabled
    && (
      !baseEnv.controlTowerFrontendReadOnly
      || !baseEnv.controlTowerFrontendFailClosed
      || !baseEnv.controlTowerFrontendMaskPii
      || !baseEnv.controlTowerFrontendAuditRequests
      || (baseEnv.controlTowerFrontendAuthRequired && !baseEnv.controlTowerFrontendTokenHash)
    )
  ) {
    warnings.push('Control Tower frontend API bridge is enabled without full auth, read-only, fail-closed, audit and masking controls.');
  }
  if (
    baseEnv.corneropsApprovalCenterEnabled
    && (
      !baseEnv.corneropsApprovalCenterDryRun
      || baseEnv.corneropsApprovalCenterAllowRealExecution
    )
  ) {
    warnings.push('Approval Center real execution is unsafe for v0.8 and will fail closed.');
  }
  if (
    baseEnv.corneropsRealSourceOnboardingEnabled
    && (!baseEnv.githubEnabled || !baseEnv.githubReadOnly)
  ) {
    warnings.push('Real-source onboarding requires GitHub enabled in read-only mode.');
  }
  if (baseEnv.githubEnabled && !baseEnv.githubReadOnly) {
    warnings.push('GITHUB_READ_ONLY=false; internal beta requires read-only GitHub.');
  }
  if (
    baseEnv.githubReadOnly
    && (baseEnv.githubAllowIssueCreation || baseEnv.githubAllowPrWrite || baseEnv.githubAllowWorkflowTrigger)
  ) {
    warnings.push('GitHub write flags are ignored while GITHUB_READ_ONLY=true.');
  }
  if (baseEnv.corneropsDataMode === 'write_enabled' && baseEnv.corneropsDryRun) {
    warnings.push('CORNEROPS_DATA_MODE=write_enabled while CORNEROPS_DRY_RUN=true; writes will remain blocked.');
  }
  if (!baseEnv.corneropsDbReadOnly || baseEnv.corneropsDbAllowWrites) {
    warnings.push('Business database safety flags are unsafe; v0.4 business reads will fail closed.');
  }
  if (
    !baseEnv.corneropsOperatorDryRun
    || !baseEnv.corneropsOperatorReadOnly
    || !baseEnv.corneropsOperatorRequireApproval
    || !baseEnv.corneropsRequireAuditForOperatorRequests
  ) {
    warnings.push('Operator interface safety flags are unsafe; requests will fail closed.');
  }
  if (
    baseEnv.corneropsRealOperatorChannelEnabled
    && (
      !baseEnv.corneropsOperatorChannelDryRun
      || !baseEnv.corneropsOperatorChannelRequireApproval
      || !baseEnv.corneropsOperatorRequireAllowlist
      || !baseEnv.corneropsOperatorPiiMasking
      || !baseEnv.corneropsOperatorLogSanitization
    )
  ) {
    warnings.push('Real operator channel safety flags are unsafe; messages will fail closed.');
  }
  if (
    baseEnv.corneropsRealOperatorChannelEnabled
    && baseEnv.corneropsOperatorChannelProvider !== 'mock'
    && !baseEnv.corneropsOperatorAllowedUserIds.length
    && !baseEnv.telegramOperatorAllowedUserIds.length
    && !baseEnv.slackOperatorAllowedUserIds.length
  ) {
    warnings.push('Real operator channel is enabled without an operator user allowlist.');
  }
  if (baseEnv.openclawOperatorChannelEnabled && !baseEnv.openclawOperatorChannelDryRun) {
    warnings.push('OpenClaw operator channel real replies are enabled; v0.6 requires dry-run.');
  }
  if (baseEnv.openclawOperatorChannelEnabled && !baseEnv.openclawOperatorChannelAllowlistOnly) {
    warnings.push('OpenClaw operator channel allowlist enforcement is disabled.');
  }
  if (
    baseEnv.corneropsTelegramRealMode
    && (
      !baseEnv.corneropsTelegramActivationEnabled
      || !baseEnv.telegramOperatorEnabled
      || !baseEnv.corneropsTelegramReadOnly
      || !baseEnv.corneropsTelegramFailClosed
      || !['file', 'file_json'].includes(baseEnv.corneropsReplayStoreProvider)
      || !['file', 'file_json'].includes(baseEnv.corneropsRejectionStoreProvider)
      || !['file', 'file_json'].includes(baseEnv.corneropsRateLimitStoreProvider)
      || !baseEnv.corneropsReplayProtectionEnabled
      || !baseEnv.corneropsReplayFailClosed
      || !baseEnv.corneropsRejectionStoreEnabled
      || !baseEnv.corneropsRateLimitingEnabled
    )
  ) {
    warnings.push('Telegram real mode is missing persistent fail-closed safety controls.');
  }
  if (
    baseEnv.corneropsTelegramActivationEnabled
    && (
      !baseEnv.telegramOperatorBotToken
      || !baseEnv.telegramOperatorWebhookSecret
      || !baseEnv.telegramOperatorAllowedChatIds.length
      || !baseEnv.telegramOperatorAllowedUserIds.length
    )
  ) {
    warnings.push('Telegram activation is missing credentials or founder allowlists.');
  }
  if (baseEnv.corneropsFirstRealSourceEnabled && baseEnv.corneropsFirstRealSourceMode !== 'read_only') {
    warnings.push('First real source mode is unsafe; mock fallback will be used.');
  }
  if (baseEnv.corneropsBusinessDataEnabled) {
    const readOnlyCredentialAvailable = baseEnv.corneropsDatabaseProvider === 'supabase'
      ? Boolean(baseEnv.supabaseUrl && baseEnv.supabaseReadonlyKey)
      : Boolean(baseEnv.readOnlyDatabaseUrl);
    if (!readOnlyCredentialAvailable) {
      warnings.push('Business data is enabled without a dedicated read-only credential; mock fallback will be used.');
    }
  }
  if (baseEnv.githubEnabled && !baseEnv.githubToken) {
    warnings.push('GITHUB_ENABLED=true but GITHUB_TOKEN is missing; GitHub integration will use mock/dry-run data.');
  }
  if (baseEnv.githubEnabled && baseEnv.githubDryRun) {
    warnings.push('GITHUB_ENABLED=true while GITHUB_DRY_RUN=true; issue creation will remain simulated.');
  }
  if (baseEnv.openclawEcosystemEnabled && baseEnv.openclawDryRun) {
    warnings.push('OPENCLAW_ECOSYSTEM_ENABLED=true while OpenClaw dry run flags are active; ecosystem calls are simulated.');
  }
  if (baseEnv.corneropsContextLayerEnabled && baseEnv.corneropsContextDryRun) {
    warnings.push('CORNEROPS_CONTEXT_LAYER_ENABLED=true while CORNEROPS_CONTEXT_DRY_RUN=true; context sync remains simulated.');
  }
  if (baseEnv.crawlersEnabled && !baseEnv.corneropsContextLayerEnabled) {
    warnings.push('CRAWLERS_ENABLED=true but CORNEROPS_CONTEXT_LAYER_ENABLED=false; crawler adapters remain disabled.');
  }
  if (!baseEnv.clawsafeAllowOutsideRoot && !baseEnv.clawsafeRoot) {
    warnings.push('CLAWSAFE_ROOT is missing; filesystem access will remain blocked.');
  }
  if (
    baseEnv.openclawEnabled &&
    !baseEnv.openclawGatewayToken &&
    !baseEnv.openclawGatewayPassword
  ) {
    warnings.push('OPENCLAW_ENABLED=true without gateway auth; only use this on trusted localhost.');
  }
  return warnings;
};

module.exports = Object.freeze({ ...baseEnv, getEnvWarnings });
