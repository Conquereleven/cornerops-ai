const env = require('../../config/env');
const { createClient } = require('@supabase/supabase-js');
const openclaw = require('../../integrations/openclaw');
const { DatabaseSafetyPolicy } = require('../../integrations/database/DatabaseSafetyPolicy');
const { DatabaseClient } = require('../../integrations/database/DatabaseClient');
const { ReadOnlyDatabaseAdapter } = require('../../integrations/database/ReadOnlyDatabaseAdapter');
const { SchemaDiscoveryService } = require('../../integrations/database/SchemaDiscoveryService');
const { MockDataAdapter } = require('../../integrations/database/adapters/MockDataAdapter');
const { GitHubClient } = require('../../integrations/github/GitHubClient');
const { GitHubIssueService } = require('../../integrations/github/GitHubIssueService');
const { GitHubPullRequestService } = require('../../integrations/github/GitHubPullRequestService');
const { GitHubActionsService } = require('../../integrations/github/GitHubActionsService');
const { GitHubWebhookHandler } = require('../../integrations/github/GitHubWebhookHandler');
const {
  CornerMexLovableConfigIntakeService,
  CornerMexLovableConfigValidator,
  CornerMexSupabaseReadOnlyActivationService,
  CornerMexSupabaseReadOnlyConfigValidator,
  LovableCornerMexConnector,
  LovableProjectDiscoveryService,
  LovableRepoDiscoveryService,
  LovableSupabaseDiscoveryService,
  LovableSupabaseMigrationDiscoveryService,
  LovableSupabaseSchemaMapper,
} = require('../../integrations/lovable');
const { DataNormalizer } = require('./DataNormalizer');
const { DataSourceRegistry } = require('./DataSourceRegistry');
const { DataAccessPolicy } = require('./DataAccessPolicy');
const { DataHealthService } = require('./DataHealthService');
const { DataSyncService } = require('./DataSyncService');
const { AuditLogRepository } = require('../domain/audit/AuditLogRepository');
const { AuditLogService } = require('../domain/audit/AuditLogService');
const { ApprovalService } = require('../domain/approvals/ApprovalService');
const { LeadRepository } = require('../domain/leads/LeadRepository');
const { LeadService } = require('../domain/leads/LeadService');
const { QuoteRepository } = require('../domain/quotes/QuoteRepository');
const { QuoteService } = require('../domain/quotes/QuoteService');
const { OrderRepository } = require('../domain/orders/OrderRepository');
const { OrderService } = require('../domain/orders/OrderService');
const { LeadReadOnlyRepository } = require('../domain/leads/LeadReadOnlyRepository');
const { QuoteReadOnlyRepository } = require('../domain/quotes/QuoteReadOnlyRepository');
const { OrderReadOnlyRepository } = require('../domain/orders/OrderReadOnlyRepository');
const { BusinessDataService } = require('../domain/business/BusinessDataService');
const { BusinessDataContractRegistry } = require('../data-contracts');
const { CornerMexDataContractRegistry, CornerMexSchemaEvidenceService } = require('../data-contracts/cornermex');
const { OpenClawEcosystemRegistry } = require('../openclaw-ecosystem/OpenClawEcosystemRegistry');
const { OpenClawEcosystemPolicy } = require('../openclaw-ecosystem/OpenClawEcosystemPolicy');
const { CraboxRunnerAdapter } = require('../openclaw-ecosystem/adapters/CraboxRunnerAdapter');
const { OctopoolGitHubRelayAdapter } = require('../openclaw-ecosystem/adapters/OctopoolGitHubRelayAdapter');
const { ClawHubSkillRegistryAdapter } = require('../openclaw-ecosystem/adapters/ClawHubSkillRegistryAdapter');
const { LobsterWorkflowShellAdapter } = require('../openclaw-ecosystem/adapters/LobsterWorkflowShellAdapter');
const { ClawSweeperTriageAdapter } = require('../openclaw-ecosystem/adapters/ClawSweeperTriageAdapter');
const { CrabfleetMissionControlAdapter } = require('../openclaw-ecosystem/adapters/CrabfleetMissionControlAdapter');
const { ClickClackChatAdapter } = require('../openclaw-ecosystem/adapters/ClickClackChatAdapter');
const {
  BusinessDataReadOnlyReadinessService,
  FirstRealSourceReadinessService,
  FirstRealSourceSelector,
  GitHubReadOnlyReadinessService,
} = require('../real-source');
const { persistenceProviderRegistry } = require('../persistence');

const businessDbConfigured = Boolean(
  env.corneropsBusinessDataEnabled
  && env.corneropsBusinessDataMode === 'read_only'
  && env.corneropsDbReadOnly
  && !env.corneropsDbAllowWrites
  && env.corneropsDatabaseProvider === 'supabase'
  && env.supabaseUrl
  && env.supabaseReadonlyKey,
);
const githubConfigured = Boolean(
  env.githubEnabled
  && env.githubReadOnly
  && env.githubToken
  && env.githubOwner
  && env.githubRepo,
);
const realSourceSelectionEnabled = env.corneropsFirstRealSourceEnabled
  || env.corneropsGithubRealReadOnlyEnabled;
const selectedConfiguredFirstSource = !realSourceSelectionEnabled
  ? 'mock'
  : env.corneropsGithubRealReadOnlyEnabled
    ? 'github'
    : env.corneropsFirstRealSource === 'auto'
    ? githubConfigured ? 'github' : businessDbConfigured ? 'business_db' : 'mock'
    : env.corneropsFirstRealSource;

const mockDataAdapter = new MockDataAdapter();
const databaseClient = new DatabaseClient({
  config: {
    mode: env.corneropsDataMode,
    provider: env.corneropsDatabaseProvider,
  },
  mockAdapter: mockDataAdapter,
});
const normalizer = new DataNormalizer();
const dataSourceRegistry = new DataSourceRegistry({
  config: {
    allowedDataSources: env.corneropsAllowedDataSources,
    businessDataEnabled: env.corneropsBusinessDataEnabled,
    businessDataMode: env.corneropsBusinessDataMode,
    dataMode: env.corneropsDataMode,
    firstRealSource: selectedConfiguredFirstSource,
    firstRealSourceEnabled: env.corneropsFirstRealSourceEnabled,
    firstRealSourceMode: env.corneropsFirstRealSourceMode,
    githubEnabled: env.githubEnabled,
    githubReadOnly: env.githubReadOnly,
    githubRealReadOnlyEnabled: env.corneropsGithubRealReadOnlyEnabled,
    githubCredentialsPresent: Boolean(env.githubToken && env.githubOwner && env.githubRepo),
    dbReadOnly: env.corneropsDbReadOnly,
    dbAllowWrites: env.corneropsDbAllowWrites,
    dbCredentialsPresent: env.corneropsDatabaseProvider === 'supabase'
      ? Boolean(env.supabaseUrl && env.supabaseReadonlyKey)
      : Boolean(env.readOnlyDatabaseUrl),
    realDataEnabled: env.corneropsRealDataEnabled,
    realSourceOnboardingEnabled:
      env.corneropsRealSourceOnboardingEnabled
      || env.corneropsFirstRealSourceEnabled
      || env.corneropsGithubRealReadOnlyEnabled,
  },
});
const dataAccessPolicy = new DataAccessPolicy({
  allowedUsers: env.corneropsAgentAllowedUsers,
  auditEnabled: env.corneropsAuditEnabled,
  dryRun: env.corneropsDryRun,
  requireAudit: env.corneropsRequireAuditForTools,
  requireApproval: env.corneropsRequireApproval,
});
const auditLogRepository = new AuditLogRepository({
  adapter: mockDataAdapter,
  enabled: env.corneropsAuditEnabled,
  store: persistenceProviderRegistry.createStore('domain-audit', {
    critical: true,
    initialData: { version: 1, records: [] },
    provider: env.corneropsAuditStoreProvider,
  }),
});
const auditLogService = new AuditLogService({
  repository: auditLogRepository,
  enabled: env.corneropsAuditEnabled,
});
const databaseSafetyPolicy = new DatabaseSafetyPolicy({
  allowWrites: env.corneropsDbAllowWrites,
  auditReads: env.corneropsDbAuditReads,
  failClosed: env.corneropsFailClosed,
  maxRows: env.corneropsDbMaxRows,
  queryTimeoutMs: env.corneropsDbQueryTimeoutMs,
  readOnly: env.corneropsDbReadOnly,
});
const businessSupabaseClient = env.corneropsBusinessDataEnabled
  && env.corneropsDatabaseProvider === 'supabase'
  && env.supabaseUrl
  && env.supabaseReadonlyKey
  ? createClient(env.supabaseUrl, env.supabaseReadonlyKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;
const readOnlyDatabaseAdapter = new ReadOnlyDatabaseAdapter({
  auditLogService,
  config: {
    allowWrites: env.corneropsDbAllowWrites,
    auditReads: env.corneropsDbAuditReads,
    businessDataEnabled: env.corneropsBusinessDataEnabled,
    credentialsAvailable: env.corneropsDatabaseProvider === 'supabase'
      ? Boolean(env.supabaseUrl && env.supabaseReadonlyKey)
      : Boolean(env.readOnlyDatabaseUrl),
    dryRun: env.corneropsBusinessDataDryRun,
    maxRows: env.corneropsDbMaxRows,
    mode: env.corneropsBusinessDataMode,
    piiMasking: env.corneropsDbPiiMasking,
    provider: env.corneropsDatabaseProvider || 'mock',
    queryTimeoutMs: env.corneropsDbQueryTimeoutMs,
    readOnly: env.corneropsDbReadOnly,
    schema: env.supabaseSchema,
  },
  mockAdapter: mockDataAdapter,
  safetyPolicy: databaseSafetyPolicy,
  supabaseClient: businessSupabaseClient,
});
const schemaDiscoveryService = new SchemaDiscoveryService({
  adapter: readOnlyDatabaseAdapter,
  auditLogService,
  enabled: env.corneropsDbSchemaDiscoveryEnabled,
});
const businessDataContractRegistry = new BusinessDataContractRegistry();
const cornerMexDataContractRegistry = new CornerMexDataContractRegistry();
const leadReadOnlyRepository = new LeadReadOnlyRepository({
  adapter: readOnlyDatabaseAdapter,
  contractRegistry: businessDataContractRegistry,
  maxRows: env.corneropsDbMaxRows,
  normalizer,
});
const quoteReadOnlyRepository = new QuoteReadOnlyRepository({
  adapter: readOnlyDatabaseAdapter,
  contractRegistry: businessDataContractRegistry,
  maxRows: env.corneropsDbMaxRows,
  normalizer,
});
const orderReadOnlyRepository = new OrderReadOnlyRepository({
  adapter: readOnlyDatabaseAdapter,
  contractRegistry: businessDataContractRegistry,
  maxRows: env.corneropsDbMaxRows,
  normalizer,
});
const businessDataService = new BusinessDataService({
  auditLogService,
  contractRegistry: businessDataContractRegistry,
  leadRepository: leadReadOnlyRepository,
  orderRepository: orderReadOnlyRepository,
  quoteRepository: quoteReadOnlyRepository,
  schemaDiscoveryService,
});
const approvalService = new ApprovalService({
  humanApprovalService: openclaw.humanApprovalService,
});
const ecosystemRegistry = new OpenClawEcosystemRegistry({ config: env });
const ecosystemPolicy = new OpenClawEcosystemPolicy({
  auditEnabled: env.corneropsAuditEnabled,
  dryRun: env.corneropsDryRun || env.openclawDryRun,
  ecosystemEnabled: env.openclawEcosystemEnabled,
  requireApproval: env.openclawRequireApproval,
  requireAudit: env.corneropsRequireAuditForTools,
});
const octopoolRelay = new OctopoolGitHubRelayAdapter({
  adapter: mockDataAdapter,
  registry: ecosystemRegistry,
  policy: ecosystemPolicy,
});
const githubClient = new GitHubClient({
  adapter: mockDataAdapter,
  approvalService,
  auditLogService,
  config: {
    allowIssueCreation: env.githubAllowIssueCreation,
    allowPrWrite: env.githubAllowPrWrite,
    allowWorkflowTrigger: env.githubAllowWorkflowTrigger,
    apiVersion: env.githubApiVersion,
    enabled: env.githubEnabled,
    dryRun: env.githubDryRun,
    auditReads: env.corneropsGithubAuditReads,
    firstRealSource: selectedConfiguredFirstSource,
    firstRealSourceEnabled: env.corneropsFirstRealSourceEnabled,
    firstRealSourceMode: env.corneropsFirstRealSourceMode,
    owner: env.githubOwner,
    readOnly: env.githubReadOnly,
    realSourceOnboardingEnabled:
      env.corneropsRealSourceOnboardingEnabled
      || env.corneropsFirstRealSourceEnabled
      || env.corneropsGithubRealReadOnlyEnabled,
    repo: env.githubRepo,
    token: env.githubToken,
    webhookSecret: env.githubWebhookSecret,
    octopoolEnabled: env.octopoolEnabled,
  },
  octopoolRelay,
});
const githubReadinessService = new GitHubReadOnlyReadinessService({
  client: githubClient,
  config: env,
});
const lovableRepoDiscoveryService = new LovableRepoDiscoveryService({
  config: env,
  githubClient,
});
const lovableSupabaseSchemaMapper = new LovableSupabaseSchemaMapper();
const lovableSupabaseMigrationDiscoveryService = new LovableSupabaseMigrationDiscoveryService({
  config: env,
  repoDiscoveryService: lovableRepoDiscoveryService,
  schemaMapper: lovableSupabaseSchemaMapper,
});
const cornerMexSupabaseReadOnlyConfigValidator = new CornerMexSupabaseReadOnlyConfigValidator({ config: env });
const cornerMexSupabaseClient = env.cornermexSupabaseEnabled
  && env.cornermexSupabaseUrl
  && env.cornermexSupabaseAnonKey
  && env.cornermexSupabaseReadOnly
  && !env.cornermexSupabaseAllowWrites
  && env.cornermexSupabaseBlockMutations
  && env.cornermexSupabaseServiceRoleKeyBlocked
  ? createClient(env.cornermexSupabaseUrl, env.cornermexSupabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;
const cornerMexSupabaseReadOnlyActivationService = new CornerMexSupabaseReadOnlyActivationService({
  auditLogService,
  config: env,
  migrationDiscoveryService: lovableSupabaseMigrationDiscoveryService,
  supabaseClient: cornerMexSupabaseClient,
  validator: cornerMexSupabaseReadOnlyConfigValidator,
});
const cornerMexSchemaEvidenceService = new CornerMexSchemaEvidenceService({
  migrationDiscoveryService: lovableSupabaseMigrationDiscoveryService,
});
const lovableSupabaseDiscoveryService = new LovableSupabaseDiscoveryService({
  config: env,
  migrationDiscoveryService: lovableSupabaseMigrationDiscoveryService,
});
const lovableProjectDiscoveryService = new LovableProjectDiscoveryService({
  config: env,
  repoDiscoveryService: lovableRepoDiscoveryService,
  supabaseDiscoveryService: lovableSupabaseDiscoveryService,
});
const lovableCornerMexConnector = new LovableCornerMexConnector({
  auditLogService,
  contractRegistry: cornerMexDataContractRegistry,
  discoveryService: lovableProjectDiscoveryService,
  supabaseReadOnlyActivationService: cornerMexSupabaseReadOnlyActivationService,
  config: env,
});
const cornerMexLovableConfigValidator = new CornerMexLovableConfigValidator({ config: env });
const cornerMexLovableConfigIntakeService = new CornerMexLovableConfigIntakeService({
  config: env,
  discoveryService: lovableProjectDiscoveryService,
  validator: cornerMexLovableConfigValidator,
});
const githubIssueService = new GitHubIssueService({ client: githubClient });
const githubPullRequestService = new GitHubPullRequestService({ client: githubClient });
const githubActionsService = new GitHubActionsService({ client: githubClient });
const firstRealSourceSelector = new FirstRealSourceSelector({
  config: {
    enabled: env.corneropsFirstRealSourceEnabled || env.corneropsGithubRealReadOnlyEnabled,
    mode: env.corneropsFirstRealSourceMode,
    preferredOrder: env.corneropsPreferredRealSourceOrder,
    source: env.corneropsGithubRealReadOnlyEnabled && env.corneropsFirstRealSource === 'auto'
      ? 'github'
      : env.corneropsFirstRealSource,
  },
});
const firstRealSourceReadinessService = new FirstRealSourceReadinessService({
  databaseAdapter: readOnlyDatabaseAdapter,
  githubClient,
  selector: firstRealSourceSelector,
});
const businessDataReadinessService = new BusinessDataReadOnlyReadinessService({
  adapter: readOnlyDatabaseAdapter,
  contractRegistry: businessDataContractRegistry,
  schemaDiscoveryService,
  config: env,
});
const githubWebhookHandler = new GitHubWebhookHandler({ auditLogService, client: githubClient });
const leadService = new LeadService({
  auditLogService,
  repository: new LeadRepository({ adapter: mockDataAdapter, normalizer }),
});
const quoteService = new QuoteService({
  auditLogService,
  repository: new QuoteRepository({ adapter: mockDataAdapter, normalizer }),
});
const orderService = new OrderService({
  auditLogService,
  repository: new OrderRepository({ adapter: mockDataAdapter, normalizer }),
});
const dataSyncService = new DataSyncService({
  enabled: env.corneropsSyncEnabled,
  intervalMinutes: env.corneropsSyncIntervalMinutes,
});
const dataHealthService = new DataHealthService({
  businessDataService,
  databaseClient,
  dataSourceRegistry,
  ecosystemRegistry,
  githubClient,
  mode: env.corneropsDataMode,
});
const craboxRunnerAdapter = new CraboxRunnerAdapter({
  auditLogService,
  registry: ecosystemRegistry,
  policy: ecosystemPolicy,
});
const clawhubSkillRegistryAdapter = new ClawHubSkillRegistryAdapter({
  adapter: mockDataAdapter,
  approvalService,
  registry: ecosystemRegistry,
  policy: ecosystemPolicy,
});
const lobsterWorkflowShellAdapter = new LobsterWorkflowShellAdapter({
  registry: ecosystemRegistry,
  policy: ecosystemPolicy,
});
const clawsweeperTriageAdapter = new ClawSweeperTriageAdapter();
const crabfleetMissionControlAdapter = new CrabfleetMissionControlAdapter();
const clickclackChatAdapter = new ClickClackChatAdapter();

module.exports = {
  approvalService,
  auditLogService,
  clawhubSkillRegistryAdapter,
  clawsweeperTriageAdapter,
  clickclackChatAdapter,
  crabfleetMissionControlAdapter,
  craboxRunnerAdapter,
  businessDataContractRegistry,
  businessDataReadinessService,
  businessDataService,
  cornerMexDataContractRegistry,
  cornerMexLovableConfigIntakeService,
  cornerMexLovableConfigValidator,
  cornerMexSchemaEvidenceService,
  cornerMexSupabaseReadOnlyActivationService,
  cornerMexSupabaseReadOnlyConfigValidator,
  databaseSafetyPolicy,
  dataAccessPolicy,
  dataHealthService,
  dataSourceRegistry,
  dataSyncService,
  databaseClient,
  ecosystemPolicy,
  ecosystemRegistry,
  firstRealSourceReadinessService,
  firstRealSourceSelector,
  githubActionsService,
  githubClient,
  githubIssueService,
  githubPullRequestService,
  githubReadinessService,
  lovableCornerMexConnector,
  lovableProjectDiscoveryService,
  lovableRepoDiscoveryService,
  lovableSupabaseDiscoveryService,
  lovableSupabaseMigrationDiscoveryService,
  lovableSupabaseSchemaMapper,
  githubWebhookHandler,
  leadService,
  leadReadOnlyRepository,
  lobsterWorkflowShellAdapter,
  mockDataAdapter,
  octopoolRelay,
  orderService,
  orderReadOnlyRepository,
  quoteService,
  quoteReadOnlyRepository,
  readOnlyDatabaseAdapter,
  schemaDiscoveryService,
};
