const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const safeEnv = {
  ...process.env,
  CORNEROPS_DRY_RUN: 'true',
  CORNEROPS_REAL_SOURCE_ONBOARDING_ENABLED: 'false',
  GITHUB_ENABLED: 'false',
  OPENCLAW_ENABLED: 'false',
  OPENCLAW_ECOSYSTEM_ENABLED: 'false',
};

const runScript = (script) => spawnSync(process.execPath, [script], {
  cwd: root,
  encoding: 'utf8',
  env: safeEnv,
  timeout: 30000,
});

describe('v0.3 demos', () => {
  test('control:tower script runs without credentials', () => {
    const result = runScript('scripts/control-tower.js');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      dryRun: true,
      security: { failClosed: true },
    });
  });

  test('demo:beta runs without credentials or external writes', () => {
    const result = runScript('scripts/demo-beta.js');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('CornerOps internal beta demo v0.3');
    expect(result.stdout).toContain('GitHub engineering');
    expect(result.stdout).toContain('security review');
  });
});
