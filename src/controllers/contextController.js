const contextCore = require('../core/context');

const requestContext = (req, agentId = 'daily-briefing-agent') => ({
  agentId,
  requestId: req.get('x-request-id'),
  userId: req.query.userId || req.body?.userId || 'api',
  channel: 'web',
});

const searchContext = async (req, res, next) => {
  try {
    const sourceIds = req.query.sourceIds
      ? String(req.query.sourceIds).split(',').map((item) => item.trim()).filter(Boolean)
      : undefined;
    return res.json(await contextCore.contextSearchService.search({
      query: req.query.q || req.query.query || '',
      sourceIds,
      filters: {
        piiMaxLevel: req.query.piiMaxLevel || 'high',
        relatedLeadId: req.query.relatedLeadId,
        relatedQuoteId: req.query.relatedQuoteId,
        relatedOrderId: req.query.relatedOrderId,
      },
      limit: req.query.limit,
    }, requestContext(req)));
  } catch (error) {
    return next(error);
  }
};

const listSources = (req, res) => res.json(contextCore.contextSourceRegistry.list());

const getSource = (req, res) => {
  const source = contextCore.contextSourceRegistry.get(req.params.id);
  if (!source) return res.status(404).json({ error: true, message: 'Context source not found.' });
  return res.json(source);
};

const getHealth = async (req, res, next) => {
  try {
    return res.json(await contextCore.contextHealthService.getReport());
  } catch (error) {
    return next(error);
  }
};

const listRecords = async (req, res, next) => {
  try {
    return res.json(await contextCore.localArchiveRepository.listRecords({
      sourceId: req.query.sourceId,
      relatedLeadId: req.query.relatedLeadId,
      relatedQuoteId: req.query.relatedQuoteId,
      relatedOrderId: req.query.relatedOrderId,
    }));
  } catch (error) {
    return next(error);
  }
};

const getRecord = async (req, res, next) => {
  try {
    const record = await contextCore.contextSearchService.getRecordById(req.params.id, requestContext(req));
    if (!record) return res.status(404).json({ error: true, message: 'Archive record not found.' });
    return res.json(record);
  } catch (error) {
    return next(error);
  }
};

const listCrawlers = (req, res) => res.json(contextCore.crawlerRegistry.list());

const getCrawlerHealth = async (req, res, next) => {
  try {
    const adapter = contextCore.crawlerAdapters[req.params.id];
    if (!adapter) return res.status(404).json({ error: true, message: 'Crawler not found.' });
    return res.json(await adapter.healthCheck(requestContext(req, 'security-audit-agent')));
  } catch (error) {
    return next(error);
  }
};

const listNativeTools = (req, res) => res.json(contextCore.nativeToolRegistry.list());

const listPluginInspectorReports = (req, res) =>
  res.json([contextCore.pluginInspectorService.inspect({
    id: 'mock-plugin',
    permissions: ['command_execution', 'filesystem'],
  })]);

const listClawbenchReports = async (req, res, next) => {
  try {
    return res.json([await contextCore.clawbenchBenchmarkService.runMockSuite()]);
  } catch (error) {
    return next(error);
  }
};

const sourceEnableRequest = (req, res) => res.status(202).json({
  status: 'dry_run',
  requiresApproval: true,
  sourceId: req.params.id,
  message: 'Context source enablement requires approval and is not applied in v0.2.',
});

const sourceSyncRequest = (req, res) => res.status(202).json({
  status: 'dry_run',
  requiresApproval: true,
  sourceId: req.params.id,
  message: 'Real crawler sync requires approval and remains disabled by default.',
});

const retentionChangeRequest = (req, res) =>
  res.status(202).json(contextCore.contextRetentionService.evaluateChange(req.body));

const nativeToolEnableRequest = (req, res) => res.status(202).json({
  status: 'dry_run',
  requiresApproval: true,
  toolId: req.params.id,
  message: 'Native tool enablement requires approval and policy review.',
});

const pluginReviewRequest = (req, res) =>
  res.status(202).json(contextCore.pluginInspectorService.reviewRequest(req.body || {}));

const clawbenchRunRequest = async (req, res, next) => {
  try {
    return res.status(202).json(await contextCore.clawbenchBenchmarkService.runMockSuite());
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  clawbenchRunRequest,
  getCrawlerHealth,
  getHealth,
  getRecord,
  getSource,
  listClawbenchReports,
  listCrawlers,
  listNativeTools,
  listPluginInspectorReports,
  listRecords,
  listSources,
  nativeToolEnableRequest,
  pluginReviewRequest,
  retentionChangeRequest,
  searchContext,
  sourceEnableRequest,
  sourceSyncRequest,
};
