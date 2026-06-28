#!/usr/bin/env node
const data = require('../src/core/data');

const main = async () => {
  const [migrationDiscovery, supabaseDiscovery, connectorStatus, evidence, activationStatus] = await Promise.all([
    data.lovableSupabaseMigrationDiscoveryService.discover(),
    data.lovableSupabaseDiscoveryService.discover(),
    data.lovableCornerMexConnector.getConnectorStatus({
      requestId: 'cornermex-supabase-read-only-check',
      agentId: 'supabase-read-only-check',
      channel: 'cli',
    }),
    data.cornerMexSchemaEvidenceService.getEvidence(),
    data.cornerMexSupabaseReadOnlyActivationService.getStatus({
      requestId: 'cornermex-supabase-read-only-check',
      agentId: 'supabase-read-only-check',
      channel: 'cli',
    }),
  ]);
  const config = data.lovableCornerMexConnector.config;
  const anonKeyConfigured = Boolean(process.env.CORNERMEX_SUPABASE_ANON_KEY);
  const unsafe = activationStatus.validation.unsafe;
  const mode = unsafe.length
    ? 'blocked_unsafe_config'
    : activationStatus.mode === 'real_read_only' || connectorStatus.sourceMode === 'real_read_only'
      ? 'real_read_only'
      : supabaseDiscovery.configured ? 'repo_discovered'
      : migrationDiscovery.mode === 'schema_discovered' ? 'repo_discovered'
      : 'missing_config';

  process.stdout.write(`${JSON.stringify({
    check: 'cornermex_supabase_read_only',
    safe: unsafe.length === 0,
    mode,
    supabaseUrlConfigured: Boolean(process.env.CORNERMEX_SUPABASE_URL),
    anonOrPublishableKeyConfigured: anonKeyConfigured,
    secrets: {
      anonKeyPresent: anonKeyConfigured,
      anonKeyPrinted: false,
      serviceRoleKeySuspected: activationStatus.validation.secrets.serviceRoleKeySuspected,
    },
    readOnlyFlags: {
      readOnly: config.supabaseReadOnly,
      allowWrites: config.supabaseAllowWrites,
      blockMutations: config.supabaseBlockMutations,
      auditReads: process.env.CORNERMEX_SUPABASE_AUDIT_READS !== 'false',
      piiMasking: process.env.CORNERMEX_SUPABASE_PII_MASKING !== 'false',
      serviceRoleKeyBlocked: activationStatus.validation.readOnlyFlags.serviceRoleKeyBlocked,
    },
    activation: {
      mode: activationStatus.mode,
      liveSchemaDiscoveryStatus: activationStatus.liveSchemaDiscoveryStatus,
      mappedEntities: activationStatus.mappedEntities,
      warnings: activationStatus.warnings,
    },
    limits: {
      maxRows: config.maxRows,
      queryTimeoutMs: config.queryTimeoutMs,
    },
    migrationDiscovery: {
      mode: migrationDiscovery.mode,
      migrationFileCount: migrationDiscovery.migrationFileCount,
      tables: migrationDiscovery.tables,
      contracts: migrationDiscovery.contracts,
      rlsPoliciesDiscovered: migrationDiscovery.rlsPoliciesDiscovered,
      writeRiskSql: migrationDiscovery.writeRiskSql,
    },
    schemaEvidence: {
      tables: evidence.tables,
      mappedContracts: evidence.mappedContracts,
    },
    missing: [
      ...activationStatus.validation.missing,
    ],
    unsafe,
    founderNextSteps: mode === 'repo_discovered'
      ? ['Add CORNERMEX_SUPABASE_URL and CORNERMEX_SUPABASE_ANON_KEY, verify RLS, then rerun this check.']
      : ['Keep writes blocked; do not use service-role credentials.'],
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerMex Supabase read-only check failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
