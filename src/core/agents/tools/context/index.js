const contextFromInput = (input = {}, agentId = 'unknown') => ({
  agentId,
  requestId: input.requestId,
  userId: input.userId,
  channel: input.channel || 'internal',
  conversationId: input.conversationId,
});

const result = (toolName, data, status = 'success') => ({
  toolName,
  status,
  count: Array.isArray(data) ? data.length : data ? 1 : 0,
  data,
});

const proposal = (toolName, payload, message) => ({
  toolName,
  status: 'dry_run',
  dryRun: true,
  requiresApproval: true,
  payload,
  message,
});

const createContextAgentTools = (deps) => {
  const search = (toolName, input, agentId, query, sourceIds, filters = {}) =>
    deps.contextSearchService.search({
      query,
      sourceIds,
      filters,
      limit: input.metadata?.limit || 10,
    }, contextFromInput(input, agentId)).then((data) => result(toolName, data));

  return {
    searchContextTool: (input, agentId) =>
      search('searchContextTool', input, agentId, input.metadata?.query || input.text),
    searchLocalArchivesTool: (input, agentId) =>
      search('searchLocalArchivesTool', input, agentId, input.metadata?.query || input.text),
    readContextSourceTool: async (input, agentId) => {
      const sourceId = input.metadata?.sourceId;
      const source = deps.contextSourceRegistry.get(sourceId);
      await deps.contextSearchService.search({
        query: sourceId || 'context',
        sourceIds: sourceId ? [sourceId] : undefined,
        limit: 1,
      }, contextFromInput(input, agentId));
      return result('readContextSourceTool', source);
    },
    summarizeContextThreadTool: async (input, agentId) => {
      const record = input.metadata?.recordId
        ? await deps.contextSearchService.getRecordById(input.metadata.recordId, contextFromInput(input, agentId))
        : (await deps.contextSearchService.search({
            query: input.metadata?.query || input.text,
            limit: 1,
          }, contextFromInput(input, agentId)))[0];
      return result('summarizeContextThreadTool', {
        summary: record
          ? `Resumen seguro: ${record.snippet || record.text || record.title}`
          : 'No context record found. No se inventa contexto.',
        record,
      });
    },
    findRelatedGitHubContextTool: (input, agentId) =>
      search('findRelatedGitHubContextTool', input, agentId, input.metadata?.query || input.text, ['github_archive']),
    findLeadCommunicationHistoryTool: (input, agentId) =>
      search('findLeadCommunicationHistoryTool', input, agentId, input.metadata?.query || input.text, [
        'whatsapp_archive',
        'telegram_archive',
        'slack_archive',
      ], { relatedLeadId: input.metadata?.leadId }),
    findSupplierContextTool: (input, agentId) =>
      search('findSupplierContextTool', input, agentId, input.metadata?.query || `${input.text} supplier UAE`, [
        'notion_archive',
        'telegram_archive',
        'google_places',
      ]),
    findProductMentionsTool: (input, agentId) =>
      search('findProductMentionsTool', input, agentId, input.metadata?.query || `${input.text} Tajin Pulparindo Valentina`, [
        'slack_archive',
        'whatsapp_archive',
        'pdf_documents',
      ]),
    readNotionContextTool: (input, agentId) =>
      search('readNotionContextTool', input, agentId, input.metadata?.query || input.text, ['notion_archive']),
    readSlackContextTool: (input, agentId) =>
      search('readSlackContextTool', input, agentId, input.metadata?.query || input.text, ['slack_archive']),
    readWhatsAppContextTool: (input, agentId) =>
      search('readWhatsAppContextTool', input, agentId, input.metadata?.query || input.text, ['whatsapp_archive']),
    readTelegramContextTool: (input, agentId) =>
      search('readTelegramContextTool', input, agentId, input.metadata?.query || input.text, ['telegram_archive']),
    runContextHealthCheckTool: async () =>
      result('runContextHealthCheckTool', await deps.contextHealthService.getReport()),
    proposeCrawlerSyncTool: (input) => Promise.resolve(proposal('proposeCrawlerSyncTool', {
      crawlerId: input.metadata?.crawlerId || 'gitcrawl',
      sourceId: input.metadata?.sourceId,
    }, 'Crawler sync is proposal-only and requires approval outside mock/dry-run.')),
    proposeContextRetentionChangeTool: (input) => Promise.resolve(proposal('proposeContextRetentionChangeTool', {
      retentionDays: input.metadata?.retentionDays,
    }, 'Retention change requires approval.')),
    proposeContextSourceEnableTool: (input) => Promise.resolve(proposal('proposeContextSourceEnableTool', {
      sourceId: input.metadata?.sourceId,
    }, 'Enabling a real context source requires approval.')),
    proposeNativeToolEnableTool: (input) => Promise.resolve(proposal('proposeNativeToolEnableTool', {
      toolId: input.metadata?.toolId,
    }, 'Native tool enablement requires approval and policy review.')),
  };
};

module.exports = {
  createContextAgentTools,
};
