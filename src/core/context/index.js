const env = require('../../config/env');
const dataCore = require('../data');
const { ToolExecutionPolicy } = require('../policies/ToolExecutionPolicy');
const { ContextAccessPolicy } = require('./ContextAccessPolicy');
const { ContextHealthService } = require('./ContextHealthService');
const { ContextIngestionService } = require('./ContextIngestionService');
const { ContextNormalizer } = require('./ContextNormalizer');
const { ContextProvenanceService } = require('./ContextProvenanceService');
const { ContextRetentionService } = require('./ContextRetentionService');
const { ContextSearchService } = require('./ContextSearchService');
const { ContextSourceRegistry } = require('./ContextSourceRegistry');
const { LocalArchiveMockAdapter } = require('../local-archives/LocalArchiveMockAdapter');
const { LocalArchiveRegistry } = require('../local-archives/LocalArchiveRegistry');
const { LocalArchiveRepository } = require('../local-archives/LocalArchiveRepository');
const { LocalArchiveSearchIndex } = require('../local-archives/LocalArchiveSearchIndex');
const { LocalArchiveSQLiteAdapter } = require('../local-archives/LocalArchiveSQLiteAdapter');
const { CrawlerPolicy } = require('../crawlers/CrawlerPolicy');
const { CrawlerRegistry } = require('../crawlers/CrawlerRegistry');
const { GitcrawlAdapter } = require('../crawlers/adapters/GitcrawlAdapter');
const { SlacrawlAdapter } = require('../crawlers/adapters/SlacrawlAdapter');
const { WacrawlAdapter } = require('../crawlers/adapters/WacrawlAdapter');
const { NotcrawlAdapter } = require('../crawlers/adapters/NotcrawlAdapter');
const { TelecrawlAdapter } = require('../crawlers/adapters/TelecrawlAdapter');
const { DiscrawlAdapter } = require('../crawlers/adapters/DiscrawlAdapter');
const { GraincrawlAdapter } = require('../crawlers/adapters/GraincrawlAdapter');
const { CrawlkitAdapter } = require('../crawlers/adapters/CrawlkitAdapter');
const { NativeToolPolicy } = require('../native-tools/NativeToolPolicy');
const { NativeToolRegistry } = require('../native-tools/NativeToolRegistry');
const { FsSafeBoundary } = require('../native-tools/FsSafeBoundary');
const { GogcliWorkspaceAdapter } = require('../native-tools/GogcliWorkspaceAdapter');
const { WacliArchiveAdapter } = require('../native-tools/WacliArchiveAdapter');
const { GoPlacesLeadDiscoveryAdapter } = require('../native-tools/GoPlacesLeadDiscoveryAdapter');
const { ClawPdfAdapter } = require('../native-tools/ClawPdfAdapter');
const { RastermillImageAdapter } = require('../native-tools/RastermillImageAdapter');
const { FfmpegWasmMediaAdapter } = require('../native-tools/FfmpegWasmMediaAdapter');
const { LibterminalAdapter } = require('../native-tools/LibterminalAdapter');
const { ProxylineAdapter } = require('../native-tools/ProxylineAdapter');
const { SdkBridgeRegistry } = require('../sdk-bridges/SdkBridgeRegistry');
const { McporterMcpAdapter } = require('../sdk-bridges/McporterMcpAdapter');
const { AcpxSessionAdapter } = require('../sdk-bridges/AcpxSessionAdapter');
const { PluginInspectorService } = require('../sdk-bridges/PluginInspectorService');
const { ClawbenchBenchmarkService } = require('../sdk-bridges/ClawbenchBenchmarkService');
const { AgentSkillsCatalog } = require('../sdk-bridges/AgentSkillsCatalog');
const { ClawpatchAdapter } = require('../sdk-bridges/ClawpatchAdapter');

const contextNormalizer = new ContextNormalizer();
const contextSourceRegistry = new ContextSourceRegistry({
  config: {
    contextLayerEnabled: env.corneropsContextLayerEnabled,
    contextMode: env.corneropsContextMode,
    retentionDays: env.corneropsContextRetentionDays,
    githubContextEnabled: env.githubContextEnabled,
    slackContextEnabled: env.slackContextEnabled,
    whatsappContextEnabled: env.whatsappContextEnabled,
    telegramContextEnabled: env.telegramContextEnabled,
    notionContextEnabled: env.notionContextEnabled,
    googleWorkspaceContextEnabled: env.googleWorkspaceContextEnabled,
    goplacesEnabled: env.goplacesEnabled,
    clawpdfEnabled: env.clawpdfEnabled,
  },
});
const contextAccessPolicy = new ContextAccessPolicy({
  allowedUsers: env.corneropsAgentAllowedUsers,
  auditEnabled: env.corneropsContextAuditEnabled,
  dryRun: env.corneropsContextDryRun,
  piiMasking: env.corneropsContextPiiMasking,
  readOnly: env.corneropsContextReadOnly,
  requireAudit: env.corneropsRequireAuditForTools,
  requireApproval: env.corneropsContextRequireApproval,
});
const localArchiveMockAdapter = new LocalArchiveMockAdapter({ normalizer: contextNormalizer });
const localArchiveSQLiteAdapter = new LocalArchiveSQLiteAdapter({
  dbPath: env.corneropsLocalArchivesDb,
  enabled: env.corneropsLocalArchivesEnabled,
});
const localArchiveRegistry = new LocalArchiveRegistry({
  adapters: {
    mock: localArchiveMockAdapter,
    sqlite: localArchiveSQLiteAdapter,
  },
});
const localArchiveSearchIndex = new LocalArchiveSearchIndex();
const localArchiveRepository = new LocalArchiveRepository({
  adapter: localArchiveMockAdapter,
  searchIndex: localArchiveSearchIndex,
});
const contextRetentionService = new ContextRetentionService({
  retentionDays: env.corneropsContextRetentionDays,
});
const contextProvenanceService = new ContextProvenanceService();
const contextSearchService = new ContextSearchService({
  auditLogService: dataCore.auditLogService,
  contextAccessPolicy,
  maxResults: env.corneropsContextMaxResults,
  repository: localArchiveRepository,
  sourceRegistry: contextSourceRegistry,
});
const contextIngestionService = new ContextIngestionService({
  auditLogService: dataCore.auditLogService,
  repository: localArchiveRepository,
});
const crawlerRegistry = new CrawlerRegistry({ config: env });
const crawlerPolicy = new CrawlerPolicy({
  auditEnabled: env.corneropsContextAuditEnabled,
  crawlersEnabled: env.crawlersEnabled && env.corneropsContextLayerEnabled,
  dryRun: env.corneropsContextDryRun,
  readOnly: env.corneropsContextReadOnly,
  requireApproval: env.corneropsContextRequireApproval,
  requireAudit: env.corneropsRequireAuditForTools,
});
const crawlerDeps = {
  auditLogService: dataCore.auditLogService,
  policy: crawlerPolicy,
  registry: crawlerRegistry,
  repository: localArchiveRepository,
};
const crawlerAdapters = {
  crawlkit: new CrawlkitAdapter(crawlerDeps),
  gitcrawl: new GitcrawlAdapter(crawlerDeps),
  slacrawl: new SlacrawlAdapter(crawlerDeps),
  wacrawl: new WacrawlAdapter(crawlerDeps),
  notcrawl: new NotcrawlAdapter(crawlerDeps),
  telecrawl: new TelecrawlAdapter(crawlerDeps),
  discrawl: new DiscrawlAdapter(crawlerDeps),
  graincrawl: new GraincrawlAdapter(crawlerDeps),
};
const nativeToolRegistry = new NativeToolRegistry({ config: env });
const nativeToolPolicy = new NativeToolPolicy({
  auditEnabled: env.corneropsContextAuditEnabled,
  dryRun: env.corneropsContextDryRun,
  requireApproval: env.corneropsContextRequireApproval,
  requireAudit: env.corneropsRequireAuditForTools,
});
const fsSafeBoundary = new FsSafeBoundary({
  allowOutsideRoot: env.clawsafeAllowOutsideRoot,
  enabled: env.fsSafeEnabled,
  root: env.clawsafeRoot,
});
const nativeToolDeps = {
  policy: nativeToolPolicy,
  registry: nativeToolRegistry,
  repository: localArchiveRepository,
};
const gogcliWorkspaceAdapter = new GogcliWorkspaceAdapter(nativeToolDeps);
const wacliArchiveAdapter = new WacliArchiveAdapter(nativeToolDeps);
const goPlacesLeadDiscoveryAdapter = new GoPlacesLeadDiscoveryAdapter(nativeToolDeps);
const clawPdfAdapter = new ClawPdfAdapter(nativeToolDeps);
const rastermillImageAdapter = new RastermillImageAdapter();
const ffmpegWasmMediaAdapter = new FfmpegWasmMediaAdapter();
const libterminalAdapter = new LibterminalAdapter();
const proxylineAdapter = new ProxylineAdapter();
const sdkBridgeRegistry = new SdkBridgeRegistry({ config: env });
const mcporterMcpAdapter = new McporterMcpAdapter({
  enabled: env.mcporterEnabled,
  dryRun: env.mcporterDryRun,
  toolExecutionPolicy: new ToolExecutionPolicy(),
});
const acpxSessionAdapter = new AcpxSessionAdapter({
  enabled: env.acpEnabled,
  dryRun: env.acpDryRun,
});
const pluginInspectorService = new PluginInspectorService();
const clawbenchBenchmarkService = new ClawbenchBenchmarkService({
  enabled: env.clawbenchEnabled,
  dryRun: env.clawbenchDryRun,
});
const agentSkillsCatalog = new AgentSkillsCatalog({
  clawhubSkillRegistryAdapter: dataCore.clawhubSkillRegistryAdapter,
});
const clawpatchAdapter = new ClawpatchAdapter({
  enabled: env.clawpatchEnabled,
  dryRun: env.clawpatchDryRun,
});
const contextHealthService = new ContextHealthService({
  archiveRepository: localArchiveRepository,
  contextMode: env.corneropsContextMode,
  crawlerRegistry,
  nativeToolRegistry,
  sdkBridgeRegistry,
  sourceRegistry: contextSourceRegistry,
});

module.exports = {
  acpxSessionAdapter,
  agentSkillsCatalog,
  clawPdfAdapter,
  clawbenchBenchmarkService,
  clawpatchAdapter,
  contextAccessPolicy,
  contextHealthService,
  contextIngestionService,
  contextNormalizer,
  contextProvenanceService,
  contextRetentionService,
  contextSearchService,
  contextSourceRegistry,
  crawlerAdapters,
  crawlerPolicy,
  crawlerRegistry,
  ffmpegWasmMediaAdapter,
  fsSafeBoundary,
  goPlacesLeadDiscoveryAdapter,
  gogcliWorkspaceAdapter,
  libterminalAdapter,
  localArchiveMockAdapter,
  localArchiveRegistry,
  localArchiveRepository,
  localArchiveSearchIndex,
  localArchiveSQLiteAdapter,
  mcporterMcpAdapter,
  nativeToolPolicy,
  nativeToolRegistry,
  pluginInspectorService,
  proxylineAdapter,
  rastermillImageAdapter,
  sdkBridgeRegistry,
  wacliArchiveAdapter,
};
