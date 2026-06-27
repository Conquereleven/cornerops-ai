#!/usr/bin/env node
const data = require('../src/core/data');

const main = async () => {
  const readiness = await data.businessDataReadinessService.check({
    testReads: true,
    requestId: `demo-business-data-read-only-${Date.now()}`,
  });
  process.stdout.write(`${JSON.stringify({
    demo: 'business_data_read_only',
    mode: readiness.mode,
    provider: readiness.provider,
    checkedReads: readiness.checkedReads,
    sampleCounts: readiness.sampleCounts,
    writes: {
      migrations: 'blocked',
      inserts: 'blocked',
      updates: 'blocked',
      deletes: 'blocked',
      schemaAlteration: 'blocked',
    },
    piiMasking: readiness.piiMasking,
    rowLimit: readiness.rowLimit,
    warnings: readiness.warnings,
    setupInstructions: readiness.setupInstructions,
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Business data read-only demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
