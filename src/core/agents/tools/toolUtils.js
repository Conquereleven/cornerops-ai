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

const readResult = (toolName, data, source = 'mock') => ({
  toolName,
  status: 'success',
  source,
  count: Array.isArray(data) ? data.length : data ? 1 : 0,
  data,
});

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
