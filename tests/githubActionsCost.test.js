const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const ci = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
const watch = fs.readFileSync('.github/workflows/prod-watch.yml', 'utf8');

function concurrency(event, head, number, runId) {
  const github = { workflow: 'CI', event_name: event, head_ref: head,
    event: { pull_request: { number } }, run_id: runId };
  const context = { github, startsWith: (s, p) => s.startsWith(p),
    format: (s, n) => s.replace('{0}', n) };
  const expression = ci.match(/cancel-in-progress: \$\{\{ (.+) \}\}/)[1];
  const group = ci.match(/  group: (.+)/)[1].replace(/\$\{\{ (.*?) \}\}/g,
    (_, expr) => vm.runInNewContext(expr, context));
  return { cancel: vm.runInNewContext(expression, context), group };
}

test('PR validation and main/develop post-merge validation remain, feature push duplication is removed', () => {
  const triggers = ci.slice(ci.indexOf('on:'), ci.indexOf('concurrency:'));
  expect(triggers).toMatch(/pull_request:/);
  expect(triggers).toMatch(/push:\s+branches:\s+- main\s+- develop/);
  expect(triggers).not.toMatch(/feature\/|paths:|paths-ignore:/);
  for (const gate of ['Lint', 'Typecheck', 'Test backend', 'Test frontend', 'Build', 'Safe beta demos']) {
    expect(ci).toContain(`name: ${gate}`);
  }
  expect(ci).toMatch(/jobs:\s+test:/); // Keep existing status context.
});

test('only the same feature PR shares a cancelable concurrency group', () => {
  expect(concurrency('pull_request', 'feature/example', 10, 100))
    .toEqual({ cancel: true, group: 'CI-pr-10' });
  expect(concurrency('pull_request', 'feature/example', 10, 101).group).toBe('CI-pr-10');
  expect(concurrency('pull_request', 'feature/other', 11, 102).group).toBe('CI-pr-11');
});

test.each(['main', 'develop', 'release/v2', 'hotfix/contact', 'security/containment'])(
  '%s push/PR validation never shares a cancelable production/release group', (head) => {
    for (const event of ['push', 'pull_request']) {
      expect(concurrency(event, head, 10, 100)).toEqual({ cancel: false, group: 'CI-100' });
      expect(concurrency(event, head, 10, 101).group).toBe('CI-101');
    }
  });

test('hourly/manual monitoring and operator authentication remain without npm or legacy customer configuration', () => {
  expect(watch).toContain("cron: '0 * * * *'");
  expect(watch).toContain('workflow_dispatch:');
  expect(watch).toContain('cancel-in-progress: false');
  expect(watch).toContain('secrets.CONTROL_TOWER_OPERATOR_TOKEN');
  expect(watch).toContain('bash .github/scripts/prod-watch.sh');
  expect(watch).not.toMatch(/npm|setup-node|CORNERMEX_SUPABASE/);
});

let temp;
beforeEach(() => {
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-monitor-'));
  fs.writeFileSync(path.join(temp, 'curl'), `#!/usr/bin/env bash
set -eu
printf '%s\\n' "$*" >> "$CURL_LOG"
case "\${!#}" in
 */api/health) printf '%s' "$HEALTH_CODE"; exit "$TRANSPORT_EXIT" ;;
 */api/intelligence/work-queue/status) printf '%s' "$AUTH_CODE" ;;
 */api/agents) printf '%s' "$DENIED_CODE" ;;
 *) exit 99 ;;
esac
`, { mode: 0o755 });
});
afterEach(() => fs.rmSync(temp, { recursive: true, force: true }));
function run(overrides = {}) {
  const log = path.join(temp, 'curl.log');
  fs.rmSync(log, { force: true });
  const result = spawnSync('bash', ['.github/scripts/prod-watch.sh'], {
    encoding: 'utf8', env: { PATH: `${temp}:${process.env.PATH}`, PROD_URL: 'https://production.invalid',
      CONTROL_TOWER_OPERATOR_TOKEN: '', CURL_LOG: log, HEALTH_CODE: '200', AUTH_CODE: '200',
      DENIED_CODE: '503', TRANSPORT_EXIT: '0', ...overrides },
  });
  return { ...result, calls: fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '' };
}

test.each(['401', '403', '503'])('expected fail-closed HTTP %s passes; no operator token means no authenticated call', (code) => {
  const r = run({ DENIED_CODE: code });
  expect(r.status).toBe(0);
  expect(r.calls).not.toContain('/work-queue/');
  expect(r.calls).toContain('--proto =https --tlsv1.2');
  expect(r.calls).not.toMatch(/--location|--insecure/);
});

test('configured operator status is still checked; token and bodies never appear in output', () => {
  const r = run({ CONTROL_TOWER_OPERATOR_TOKEN: 'synthetic-test-only' });
  expect(r.status).toBe(0);
  expect(r.calls).toContain('Authorization: Bearer synthetic-test-only');
  expect(r.stdout + r.stderr).not.toContain('synthetic-test-only');
  expect(r.calls).toContain('--output /dev/null');
});

test.each(['401', '403', '404', '500', '302'])('authenticated HTTP %s fails monitoring', (code) => {
  expect(run({ AUTH_CODE: code, CONTROL_TOWER_OPERATOR_TOKEN: 'synthetic' }).status).not.toBe(0);
});
test.each(['200', '302', '404', '500'])('unauthenticated internal API HTTP %s cannot pass', (code) => {
  expect(run({ DENIED_CODE: code }).status).not.toBe(0);
});
test('health failure, transport/TLS failure and insecure origin fail closed', () => {
  expect(run({ HEALTH_CODE: '503' }).status).not.toBe(0);
  expect(run({ TRANSPORT_EXIT: '60' }).status).not.toBe(0);
  const insecure = run({ PROD_URL: 'http://production.invalid' });
  expect(insecure.status).not.toBe(0);
  expect(insecure.calls).toBe('');
});
