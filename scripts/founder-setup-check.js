#!/usr/bin/env node
const env = require('../src/config/env');
const { FounderSetupValidator } = require('../src/core/setup/FounderSetupValidator');

const format = (report) => {
  const lines = [
    `CornerOps Founder Setup Check ${report.version}`,
    `Status: ${report.status.toUpperCase()} · OK ${report.counts.ok} · Warning ${report.counts.warning} · Blocked ${report.counts.blocked}`,
    'Secrets printed: no',
    '',
  ];
  for (const check of report.checks) {
    const label = check.status === 'ok' ? 'OK' : check.status === 'warning' ? 'Warning' : 'Blocked';
    lines.push(`[${label}] ${check.label}: ${check.message}`);
    if (check.fix) lines.push(`  Recommended fix: ${check.fix}`);
  }
  return lines.join('\n');
};

const main = () => {
  const report = new FounderSetupValidator({ config: env }).run();
  process.stdout.write(`${format(report)}\n`);
  if (report.status === 'blocked') process.exitCode = 1;
};

if (require.main === module) main();

module.exports = { format, main };
