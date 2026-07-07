#!/usr/bin/env node
require('./safe-cli-state-env');
const data = require('../src/core/data');
const { CornerMexFlowEngine } = require('../src/core/flows/cornermex');
const { ControlTowerFrontendContract } = require('../src/api/contracts/controlTowerFrontendContract');

const main = async () => {
  const context = {
    requestId: 'demo-v1.4',
    agentId: 'demo-v1.4',
    channel: 'cli',
  };
  const flowEngine = new CornerMexFlowEngine({
    auditLogService: data.auditLogService,
    connector: data.lovableCornerMexConnector,
  });
  const [activation, connector, flows] = await Promise.all([
    data.cornerMexSupabaseReadOnlyActivationService.getStatus(context),
    data.lovableCornerMexConnector.getConnectorStatus(context),
    flowEngine.analyzeFlows({ requestId: 'demo-v1.4-flow', operatorId: 'demo-v1.4' }),
  ]);
  const frontendContract = new ControlTowerFrontendContract({
    approvalCenterService: {
      list: async () => ({ approvals: [], pendingCount: 0 }),
    },
    auditViewerService: {
      getEvents: async () => ({ events: [{ id: activation.auditId, eventType: 'cornermex_supabase_read', summary: 'sanitized readiness check' }] }),
    },
    controlTowerReportService: {
      getReport: async () => ({
        generatedAt: new Date().toISOString(),
        safety: { externalSendsBlocked: true, warnings: connector.warnings || [] },
        realSourceExpansion: { sourceModeSummary: connector.sourceMode },
        openclaw: { enabled: false },
        cornerMexLovableConnector: {
          ...connector,
          supabaseRealReadOnlyReadiness: connector.sourceMode === 'real_read_only'
            ? 'ready'
            : connector.sourceMode === 'real_read_only_partial' ? 'partial' : 'pending_credentials',
        },
        cornerMexFlowEngine: {
          sourceMode: flows.sourceMode,
          dataSource: flows.dataSource,
          supabaseStatus: flows.supabaseStatus,
          tableAvailability: flows.tableAvailability,
          availableFlows: flows.availableFlows,
          flowsWithEnoughData: flows.summary?.flowsWithData || [],
          flowsMissingData: flows.summary?.flowsMissingData || [],
        },
        telegramOperator: { operatorMode: 'polling', founderPollingStatus: 'active_local_founder_only' },
      }),
    },
    controlledActionExecutor: {
      status: () => ({ enabled: true, dryRun: true, realExecutionAllowed: false, actions: [] }),
    },
    flowEngine: { analyzeFlows: async () => flows },
    messageDraftService: {
      createDraft: async () => ({
        auditId: 'audit-demo-v14-draft',
        draft: { id: 'draft-demo-v14', sendStatus: 'not_sendable_in_v1.2', localOnly: true },
        warnings: ['Draft is local/internal only.'],
      }),
    },
  });
  const frontendPayload = await frontendContract.getAllSections();
  const mode = activation.mode === 'real_read_only' || activation.mode === 'real_read_only_partial'
    ? activation.mode
    : 'blocked_by_missing_supabase_readonly_config';
  process.stdout.write(`${JSON.stringify({
    demo: 'cornerops_v1.4',
    mode,
    supabaseReadOnly: {
      sourceMode: activation.mode,
      supabaseStatus: activation.supabaseStatus,
      tableAvailability: activation.tableAvailability,
      rowCounts: activation.rowCounts,
      maskingApplied: activation.maskingApplied,
      auditId: activation.auditId,
      lastReadAt: activation.lastReadAt,
      missing: activation.validation?.missing || activation.missing || [],
      unsafe: activation.validation?.unsafe || activation.unsafe || [],
      warnings: activation.warnings,
    },
    connector: {
      sourceMode: connector.sourceMode,
      dataSource: connector.dataSource,
      supabaseStatus: connector.supabaseStatus,
      tableAvailability: connector.tableAvailability,
      writesBlocked: connector.writesBlocked !== false,
      maskingApplied: connector.maskingApplied,
      auditId: connector.auditId,
    },
    flowEngine: flows ? {
      sourceMode: flows.sourceMode,
      dataSource: flows.dataSource,
      supabaseStatus: flows.supabaseStatus,
      tableAvailability: flows.tableAvailability,
      auditId: flows.auditId,
      writesBlocked: flows.writesBlocked,
    } : null,
    frontendContract: {
      sourceMode: frontendPayload.sourceMode,
      statusSupabaseStatus: frontendPayload.sections?.status?.data?.supabaseStatus,
      cornerMexSourceMode: frontendPayload.sections?.cornermex?.sourceMode,
      cornerMexSupabaseStatus: frontendPayload.sections?.cornermex?.data?.supabaseStatus,
      writesBlocked: frontendPayload.writesBlocked,
      externalSendsBlocked: frontendPayload.externalSendsBlocked,
      auditId: frontendPayload.auditId,
    },
    finalSafetySummary: {
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      serviceRoleBlocked: true,
      noSecretsPrinted: true,
      whatsappSendsDisabled: true,
      emailSendsDisabled: true,
      customerChannelsDisabled: true,
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerOps v1.4 demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
