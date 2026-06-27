const { spawnSync } = require('child_process');
const path = require('path');

const runScript = (name) => spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', name)], {
  cwd: path.join(__dirname, '..'),
  encoding: 'utf8',
  env: { ...process.env, NODE_ENV: 'test' },
});

describe('v0.9 credential-free demos', () => {
  test.each([
    ['demo-controlled-actions.js', 'duplicatePrevented'],
    ['demo-github-issue-action.js', 'realGitHubIssueCreated'],
    ['demo-internal-notes-tasks.js', 'businessDatabaseWrites'],
    ['demo-v0.9.js', 'payments/orders/leads/quotes denied'],
  ])('%s runs without credentials', (script, marker) => {
    const result = runScript(script);
    expect(result.status).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(marker);
    expect(`${result.stdout}${result.stderr}`).not.toContain(['gh', 'p_'].join(''));
  });
});
