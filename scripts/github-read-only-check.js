#!/usr/bin/env node
const data = require('../src/core/data');

const main = async () => {
  const result = await data.githubReadinessService.check({
    testReads: true,
    requestId: `github-read-only-check-${Date.now()}`,
  });
  process.stdout.write(`${JSON.stringify({
    check: 'github_read_only',
    safe: result.readOnlyVerified && result.writesBlocked,
    mode: result.mode,
    status: result.status,
    repo: result.repo,
    tokenPresent: result.tokenPresent,
    tokenExposed: false,
    checkedReads: result.checkedReads,
    sampleCounts: result.sampleCounts,
    writeFlags: result.writeFlags,
    auditReads: result.auditReads,
    rateLimit: result.rateLimit,
    warnings: result.warnings,
    setupInstructions: result.setupInstructions,
  }, null, 2)}\n`);
  if (!result.readOnlyVerified || !result.writesBlocked) process.exitCode = 1;
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`GitHub read-only check failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
