const env = require('../../config/env');
const openclaw = require('../../integrations/openclaw');
const { DatabaseClient } = require('../../integrations/database/DatabaseClient');
const { MockDataAdapter } = require('../../integrations/database/adapters/MockDataAdapter');
const { GitHubClient } = require('../../integrations/github/GitHubClient');
const { GitHubIssueService } = require('../../integrations/github/GitHubIssueService');
const { GitHubPullRequestService } = require('../../integrations/github/GitHubPullRequestService');
const { GitHubActionsService } = require('../../integrations/github/GitHubActionsService');
const { GitHubWebhookHandler } = require('../../integrations/github/GitHubWebhookHandler');
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
const { OpenClawEcosystemRegistry } = require('../openclaw-ecosystem/OpenClawEcosystemRegistry');
const { OpenClawEcosystemPolicy } = require('../openclaw-ecosystem/OpenClawEcosystemPolicy');
const { CraboxRunnerAdapter } = require('../openclaw-ecosystem/adapters/CraboxRunnerAdapter');
const { OctopoolGitHubRelayAdapter } = require('../openclaw-ecosystem/adapters/OctopoolGitHubRelayAdapter');
const { ClawHubSkillRegistryAdapter } = require('../openclaw-ecosystem/adapters/ClawHubSkillRegistryAdapter');
const { LobsterWorkflowShellAdapter } = require('../openclaw-ecosystem/adapters/LobsterWorkflowShellAdapter');
const { ClawSweeperTriageAdapter } = require('../openclaw-ecosystem/adapters/ClawSweeperTriageAdapter');
const { CrabfleetMissionControlAdapter } = require('../openclaw-ecosystem/adapters/CrabfleetMissionControlAdapter');
const { ClickClackChatAdapter } = require('../openclaw-ecosystem/adapters/ClickClackChatAdapter');

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
    dataMode: env.corneropsDataMode,
    firstRealSource: env.corneropsFirstRealSource,
    firstRealSourceMode: env.corneropsFirstRealSourceMode,
    githubEnabled: env.githubEnabled,
    githubReadOnly: env.githubReadOnly,
    realDataEnabled: env.corneropsRealDataEnabled,
    realSourceOnboardingEnabled: env.corneropsRealSourceOnboardingEnabled,
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
});
const auditLogService = new AuditLogService({
  repository: auditLogRepository,
  enabled: env.corneropsAuditEnabled,
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
    firstRealSource: env.corneropsFirstRealSource,
    firstRealSourceMode: env.corneropsFirstRealSourceMode,
    owner: env.githubOwner,
    readOnly: env.githubReadOnly,
    realSourceOnboardingEnabled: env.corneropsRealSourceOnboardingEnabled,
    repo: env.githubRepo,
    token: env.githubToken,
    webhookSecret: env.githubWebhookSecret,
    octopoolEnabled: env.octopoolEnabled,
  },
  octopoolRelay,
});
const githubIssueService = new GitHubIssueService({ client: githubClient });
const githubPullRequestService = new GitHubPullRequestService({ client: githubClient });
const githubActionsService = new GitHubActionsService({ client: githubClient });
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
  dataAccessPolicy,
  dataHealthService,
  dataSourceRegistry,
  dataSyncService,
  databaseClient,
  ecosystemPolicy,
  ecosystemRegistry,
  githubActionsService,
  githubClient,
  githubIssueService,
  githubPullRequestService,
  githubWebhookHandler,
  leadService,
  lobsterWorkflowShellAdapter,
  mockDataAdapter,
  octopoolRelay,
  orderService,
  quoteService,
};
