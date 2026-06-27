#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requiredSourceLabels = [
  'Founder Beta Readiness',
  'ApprovalCenter',
  'AuditViewer',
  'Security Dashboard',
  'OperatorAskPanel',
  'Controlled actions',
];
const secretPatterns = [
  /github_pat_[A-Za-z0-9_]{20,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/,
];

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const run = () => {
  const source = read('frontend/src/routes/ControlTower.tsx');
  const api = read('frontend/src/lib/api.ts');
  const docs = read('docs/acceptance/visual-acceptance-v1.0.md');
  const haystack = `${source}\n${api}\n${docs}`;
  const missing = requiredSourceLabels.filter((label) => !haystack.includes(label));
  const distIndex = path.join(root, 'frontend/dist/index.html');
  const distExists = fs.existsSync(distIndex);
  const dist = distExists ? read('frontend/dist/index.html') : '';
  const secretHits = secretPatterns.flatMap((pattern) => [
    ...(haystack.match(pattern) || []),
    ...(dist.match(pattern) || []),
  ]);
  const report = {
    version: 'v1.0',
    status: missing.length || secretHits.length ? 'blocked' : 'ok',
    checks: {
      sourceSectionsPresent: missing.length === 0,
      v10EndpointUsed: api.includes('/api/control-tower/v1.0/status'),
      distIndexExists: distExists,
      secretsFound: secretHits.length,
      missing,
    },
    warning: distExists ? null : 'frontend/dist/index.html is missing; run npm run build before final release acceptance.',
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status === 'blocked') process.exitCode = 1;
  return report;
};

if (require.main === module) run();

module.exports = { run };
