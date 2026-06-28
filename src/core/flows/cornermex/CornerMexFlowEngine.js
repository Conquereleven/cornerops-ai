const { CornerMexFlowAnalyzer } = require('./CornerMexFlowAnalyzer');
const { CornerMexFlowRegistry } = require('./CornerMexFlowRegistry');

class CornerMexFlowEngine {
  constructor({
    analyzer = new CornerMexFlowAnalyzer(),
    auditLogService,
    connector,
    registry = new CornerMexFlowRegistry(),
  } = {}) {
    this.analyzer = analyzer;
    this.auditLogService = auditLogService;
    this.connector = connector;
    this.registry = registry;
  }

  async analyzeFlows({ requestId = 'cornermex-flow-analysis', operatorId = 'local-founder', flowIds } = {}) {
    const context = { requestId, userId: operatorId, agentId: 'cornermex-flow-engine-v1.2' };
    const status = await this.connector.getConnectorStatus(context);
    const [products, leads, quotes, orders, customers] = await Promise.all([
      this.connector.listProducts({ limit: 100 }, context),
      this.connector.listLeads({ limit: 100 }, context),
      this.connector.listQuotes({ limit: 100 }, context),
      this.connector.listOrders({ limit: 100 }, context),
      this.connector.listCustomers({ limit: 100 }, context),
    ]);
    const sourceModes = [products, leads, quotes, orders, customers]
      .map((result) => result.meta?.source)
      .filter(Boolean);
    const sourceMode = this.combineModes(sourceModes, status.sourceMode);
    const analysis = this.analyzer.analyze({
      collections: { products, leads, quotes, orders, customers },
      sourceMode,
      status,
    });
    const selectedFlows = flowIds?.length
      ? analysis.flows.filter((flow) => flowIds.includes(flow.id))
      : analysis.flows;
    const audit = await this.auditLogService?.record?.({
      requestId,
      eventType: 'cornermex_flow_analysis',
      dataSource: 'cornermex_lovable',
      operation: 'analyze_operator_flows',
      userId: operatorId,
      channel: 'internal',
      policyDecision: 'allowed',
      status: 'success',
      input: {
        sourceMode,
        flowCount: selectedFlows.length,
        writesBlocked: true,
      },
    });
    return {
      ...analysis,
      flows: selectedFlows,
      availableFlows: this.registry.list().map((flow) => flow.id),
      auditId: audit?.id,
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
    };
  }

  combineModes(modes, fallback = 'mock') {
    const unique = [...new Set(modes.length ? modes : [fallback])];
    if (unique.length > 1) return 'mixed';
    return unique[0] || fallback || 'mock';
  }

  formatFlowSummary(analysis, flowId) {
    const flows = flowId ? analysis.flows.filter((flow) => flow.id === flowId) : analysis.flows;
    if (!flows.length) return 'No flow analysis is available for that request.';
    return flows.map((flow) => [
      `${flow.id}: ${flow.records.length} candidate(s).`,
      ...flow.records.slice(0, 5).map((record) => `- ${record.id}: ${record.reason}`),
      flow.records.length > 5 ? `- ${flow.records.length - 5} more candidate(s) summarized.` : null,
    ].filter(Boolean).join('\n')).join('\n\n');
  }
}

module.exports = { CornerMexFlowEngine };
