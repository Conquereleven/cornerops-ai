#!/usr/bin/env node
const data = require('../src/core/data');

const main = async () => {
  const result = await data.businessDataReadinessService.check({
    testReads: true,
    requestId: `business-data-read-only-check-${Date.now()}`,
  });
  process.stdout.write(`${JSON.stringify({
    check: 'business_data_read_only',
    safe: result.readOnlyVerified && result.writesBlocked && result.piiMasking,
    mode: result.mode,
    status: result.status,
    provider: result.provider,
    credentialsPresent: result.credentialsPresent,
    secretsExposed: false,
    checkedReads: result.checkedReads,
    sampleCounts: result.sampleCounts,
    rowLimit: result.rowLimit,
    queryTimeoutMs: result.queryTimeoutMs,
    schemaDiscoveryEnabled: result.schemaDiscoveryEnabled,
    piiMasking: result.piiMasking,
    auditReads: result.auditReads,
    mappedEntities: result.mappedEntities.map((mapping) => ({
      entity: mapping.entity,
      sourceTable: mapping.sourceTable,
      confidence: mapping.confidence,
      warnings: mapping.warnings,
    })),
    warnings: result.warnings,
    setupInstructions: result.setupInstructions,
  }, null, 2)}\n`);
  if (!result.readOnlyVerified || !result.writesBlocked || !result.piiMasking) process.exitCode = 1;
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Business data read-only check failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
