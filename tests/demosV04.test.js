const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const run = (script) => spawnSync(process.execPath, [script], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, CORNEROPS_BUSINESS_DATA_ENABLED: 'false', CORNEROPS_DB_ALLOW_WRITES: 'false' },
});

describe('v0.4 beta demos', () => {
  test.each([
    ['scripts/demo-beta.js', 'CornerOps internal beta demo v0.4'],
    ['scripts/demo-business-data.js', 'business-data-v0.4'],
    ['scripts/control-tower-beta.js', 'writesBlocked'],
  ])('%s runs without credentials', (script, marker) => {
    const result = run(script);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(marker);
    expect(result.stderr).toBe('');
  });
});
