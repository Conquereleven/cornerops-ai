#!/usr/bin/env node
require('./safe-cli-state-env');
const data = require('../src/core/data');

const compactTableAvailability = (availability = {}) => Object.fromEntries(
  Object.entries(availability).map(([entity, status]) => [entity, status]),
);

const main = async () => {
  const context = {
    requestId: 'cornermex-supabase-readonly-check-v1.4',
    agentId: 'supabase-readonly-check-v1.4',
    channel: 'cli',
  };
  const [activationStatus, connectorStatus] = await Promise.all([
    data.cornerMexSupabaseReadOnlyActivationService.getStatus(context),
    data.lovableCornerMexConnector.getConnectorStatus(context),
  ]);
  const missing = activationStatus.validation?.missing || activationStatus.missing || [];
  const unsafe = activationStatus.validation?.unsafe || activationStatus.unsafe || [];
  const tableAvailability = compactTableAvailability(activationStatus.tableAvailability);
  const mode = unsafe.length
    ? 'blocked_unsafe_config'
    : activationStatus.mode === 'real_read_only' || activationStatus.mode === 'real_read_only_partial'
      ? activationStatus.mode
      : 'blocked_by_missing_supabase_readonly_config';
  const output = {
    check: 'cornermex_supabase_readonly_v1.4',
    mode,
    sourceMode: activationStatus.mode,
    connectorMode: connectorStatus.sourceMode,
    dataSource: connectorStatus.dataSource,
    supabaseStatus: activationStatus.supabaseStatus,
    tableAvailability,
    rowCounts: activationStatus.rowCounts || {},
    readOnly: true,
    writesBlocked: true,
    externalSendsBlocked: true,
    maskingApplied: activationStatus.maskingApplied !== false,
    lastReadAt: activationStatus.lastReadAt || null,
    auditId: activationStatus.auditId,
    credentials: {
      supabaseUrlPresent: activationStatus.validation?.secrets?.urlPresent || false,
      anonKeyPresent: activationStatus.validation?.secrets?.anonKeyPresent || false,
      anonKeyPrinted: false,
      serviceRoleKeySuspected: activationStatus.validation?.secrets?.serviceRoleKeySuspected || false,
    },
    readOnlyFlags: activationStatus.validation?.readOnlyFlags || activationStatus.readOnlyFlags,
    limits: activationStatus.validation?.limits || activationStatus.limits,
    missing,
    unsafe,
    warnings: activationStatus.warnings || [],
    founderNextSteps: mode === 'blocked_by_missing_supabase_readonly_config'
      ? [
        'Set CORNERMEX_SUPABASE_ENABLED=true locally or in Railway.',
        'Set CORNERMEX_SUPABASE_URL.',
        'Set CORNERMEX_SUPABASE_ANON_KEY with anon/publishable read-only access only.',
        'Keep CORNERMEX_SUPABASE_ALLOW_WRITES=false and CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED=true.',
        'Rerun npm run cornermex:supabase-readonly-check.',
      ]
      : ['Keep writes blocked and monitor tableAvailability before exposing summaries in Lovable.'],
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerMex Supabase read-only v1.4 check failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
