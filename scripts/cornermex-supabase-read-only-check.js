#!/usr/bin/env node
const data = require('../src/core/data');
const { serviceRoleLike } = require('../src/integrations/lovable');

const main = async () => {
  const [migrationDiscovery, supabaseDiscovery, connectorStatus, evidence] = await Promise.all([
    data.lovableSupabaseMigrationDiscoveryService.discover(),
    data.lovableSupabaseDiscoveryService.discover(),
    data.lovableCornerMexConnector.getConnectorStatus({
      requestId: 'cornermex-supabase-read-only-check',
      agentId: 'supabase-read-only-check',
      channel: 'cli',
    }),
    data.cornerMexSchemaEvidenceService.getEvidence(),
  ]);
  const config = data.lovableCornerMexConnector.config;
  const anonKeyConfigured = Boolean(process.env.CORNERMEX_SUPABASE_ANON_KEY);
  const unsafe = [
    ...(config.supabaseAllowWrites ? ['CORNERMEX_SUPABASE_ALLOW_WRITES must remain false.'] : []),
    ...(!config.supabaseReadOnly ? ['CORNERMEX_SUPABASE_READ_ONLY must remain true.'] : []),
    ...(!config.supabaseBlockMutations ? ['CORNERMEX_SUPABASE_BLOCK_MUTATIONS must remain true.'] : []),
    ...(serviceRoleLike(process.env.CORNERMEX_SUPABASE_ANON_KEY) ? ['Service-role-like key detected; use anon/read-only key only.'] : []),
  ];
  const mode = unsafe.length
    ? 'blocked_unsafe_config'
    : connectorStatus.sourceMode === 'real_read_only'
      ? 'real_read_only'
      : migrationDiscovery.mode === 'schema_discovered'
        ? 'schema_discovered'
        : supabaseDiscovery.configured ? 'repo_discovered' : 'missing_config';

  process.stdout.write(`${JSON.stringify({
    check: 'cornermex_supabase_read_only',
    safe: unsafe.length === 0,
    mode,
    supabaseUrlConfigured: Boolean(process.env.CORNERMEX_SUPABASE_URL),
    anonOrPublishableKeyConfigured: anonKeyConfigured,
    secrets: {
      anonKeyPresent: anonKeyConfigured,
      anonKeyPrinted: false,
      serviceRoleKeySuspected: serviceRoleLike(process.env.CORNERMEX_SUPABASE_ANON_KEY),
    },
    readOnlyFlags: {
      readOnly: config.supabaseReadOnly,
      allowWrites: config.supabaseAllowWrites,
      blockMutations: config.supabaseBlockMutations,
      auditReads: process.env.CORNERMEX_SUPABASE_AUDIT_READS !== 'false',
      piiMasking: process.env.CORNERMEX_SUPABASE_PII_MASKING !== 'false',
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
      ...(!process.env.CORNERMEX_SUPABASE_URL ? ['CORNERMEX_SUPABASE_URL'] : []),
      ...(!process.env.CORNERMEX_SUPABASE_ANON_KEY ? ['CORNERMEX_SUPABASE_ANON_KEY'] : []),
    ],
    unsafe,
    founderNextSteps: mode === 'schema_discovered'
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
