const { DATA_OPERATIONS } = require('../../data/dataTypes');

const contextFromInput = (input = {}, agentId = 'unknown') => ({
  agentId,
  requestId: input.requestId,
  userId: input.userId,
  channel: input.channel,
  conversationId: input.conversationId,
});

const evaluateDataRead = ({ dataAccessPolicy, dataSourceRegistry, input, agentId, sourceId }) =>
  dataAccessPolicy.evaluate({
    agentId,
    channel: input.channel,
    dataSource: dataSourceRegistry.get(sourceId),
    operation: DATA_OPERATIONS.READ,
    userId: input.userId,
  });

const deniedResult = (toolName, policy) => ({
  toolName,
  status: 'denied',
  reason: policy.reason,
  data: [],
});

const readResult = (toolName, data, source = 'mock') => {
  const businessResult = data && typeof data === 'object' && 'meta' in data && 'data' in data;
  const payload = businessResult ? data.data : data;
  const metadata = businessResult ? data.meta : undefined;
  return {
    toolName,
    status: 'success',
    source: metadata?.source || source,
    sourceMode: metadata?.source || source,
    readOnly: metadata?.readOnly ?? true,
    count: metadata?.rowCount ?? (Array.isArray(payload) ? payload.length : payload ? 1 : 0),
    truncated: metadata?.truncated || false,
    warnings: metadata?.warnings || [],
    data: payload,
  };
};

const dryRunProposal = (toolName, payload, message = 'Proposal created in dry run.') => ({
  toolName,
  status: 'dry_run',
  dryRun: true,
  payload,
  message,
});

module.exports = {
  contextFromInput,
  deniedResult,
  dryRunProposal,
  evaluateDataRead,
  readResult,
};
