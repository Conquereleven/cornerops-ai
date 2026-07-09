const { CornerMexFlowEngine } = require('../flows/cornermex');
const {
  buildAnomaliesFromFlows,
  buildConnectors,
  buildIntelligenceOverview,
  buildPlaybooks,
  buildSignalsFromFlows,
  convertAnomalyToCaseDraft,
} = require('./IntelligenceEngine');

class IntelligenceService {
  constructor({
    auditLogService,
    connector,
    flowEngine,
  } = {}) {
    this.auditLogService = auditLogService;
    this.connector = connector;
    this.flowEngine = flowEngine || new CornerMexFlowEngine({ auditLogService, connector });
  }

  async context(requestId = 'intelligence-v1.5') {
    return {
      requestId,
      userId: 'intelligence-api',
      channel: 'api',
      agentId: 'cornerops-intelligence-v1.5',
    };
  }

  async buildState(options = {}) {
    const context = await this.context(options.requestId);
    const connectorStatus = await this.connector.getConnectorStatus(context);
    const flowAnalysis = await this.flowEngine.analyzeFlows({
      requestId: context.requestId,
      operatorId: context.userId,
    });
    const clients = [{
      id: 'client-cornermex',
      slug: 'cornermex',
      name: 'CornerMex',
      pilot: true,
      sourceMode: connectorStatus.sourceMode,
      dataSource: connectorStatus.dataSource,
      readOnly: true,
      writesBlocked: true,
    }];
    const signals = buildSignalsFromFlows(flowAnalysis);
    const anomalies = buildAnomaliesFromFlows(flowAnalysis);
    const cases = anomalies.slice(0, 10).map((anomaly) => convertAnomalyToCaseDraft(anomaly));
    const playbooks = buildPlaybooks();
    const connectors = buildConnectors(connectorStatus);
    const overview = buildIntelligenceOverview({
      connectorStatus,
      flowAnalysis,
      clients,
      signals,
      anomalies,
      cases,
      playbooks,
      connectors,
    });
    const audit = await this.auditLogService?.record?.({
      ...context,
      eventType: 'intelligence_read',
      dataSource: overview.dataSource,
      operation: 'build_intelligence_overview',
      policyDecision: 'allowed_read_only',
      status: 'success',
      input: {
        sourceMode: overview.sourceMode,
        signalCount: signals.length,
        anomalyCount: anomalies.length,
        writesBlocked: true,
      },
    });
    return { overview: { ...overview, auditId: audit?.id || overview.auditId }, clients, signals, anomalies, cases, playbooks, connectors, flowAnalysis };
  }

  async getOverview(options = {}) { return (await this.buildState(options)).overview; }
  async listClients(options = {}) { return (await this.buildState(options)).clients; }
  async listSignals(options = {}) { return (await this.buildState(options)).signals; }
  async listAnomalies(options = {}) { return (await this.buildState(options)).anomalies; }
  async listCases(options = {}) { return (await this.buildState(options)).cases; }
  async listPlaybooks() { return buildPlaybooks(); }
  async listConnectors(options = {}) { return (await this.buildState(options)).connectors; }

  async createCaseFromAnomaly(anomaly = {}, options = {}) {
    const context = await this.context(options.requestId || 'intelligence-case-draft-v1.5');
    const caseDraft = convertAnomalyToCaseDraft(anomaly);
    const audit = await this.auditLogService?.record?.({
      ...context,
      eventType: 'intelligence_case_draft',
      dataSource: 'local_internal',
      operation: 'create_case_from_anomaly_dry_run',
      policyDecision: 'draft_only',
      status: 'success',
      input: { anomalyKey: caseDraft.anomalyKey, writesBlocked: true },
    });
    return {
      status: 'dry_run',
      sourceMode: 'local_internal',
      readOnly: true,
      dryRun: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      auditId: audit?.id,
      caseDraft,
      warnings: ['Case creation is draft-only in v1.5; no persistence or CornerMex mutation occurred.'],
    };
  }

  async updateCaseStatus(caseId, status, options = {}) {
    const context = await this.context(options.requestId || 'intelligence-case-status-v1.5');
    const audit = await this.auditLogService?.record?.({
      ...context,
      eventType: 'intelligence_case_status_dry_run',
      dataSource: 'local_internal',
      operation: 'update_case_status_dry_run',
      policyDecision: 'draft_only',
      status: 'success',
      input: { caseId, targetStatus: status, writesBlocked: true },
    });
    return {
      status: 'dry_run',
      sourceMode: 'local_internal',
      readOnly: true,
      dryRun: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      auditId: audit?.id,
      caseDraft: { id: caseId, status },
      warnings: ['Case status updates are dry-run only in v1.5; no persistence occurred.'],
    };
  }
}

module.exports = { IntelligenceService };
