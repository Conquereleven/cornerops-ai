const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const runCli = (args) => spawnSync(process.execPath, ['src/cli/cornerops.js', ...args], {
  cwd: root,
  encoding: 'utf8',
  env: {
    ...process.env,
    CORNEROPS_CLI_ENABLED: 'true',
    CORNEROPS_OPERATOR_INTERFACE_ENABLED: 'true',
    CORNEROPS_OPERATOR_DRY_RUN: 'true',
    CORNEROPS_OPERATOR_READ_ONLY: 'true',
    CORNEROPS_OPERATOR_REQUIRE_APPROVAL: 'true',
    CORNEROPS_BUSINESS_DATA_ENABLED: 'false',
    OPENCLAW_ENABLED: 'false',
  },
});

describe('CornerOps operator CLI v0.5', () => {
  test.each([
    [['help'], 'Available commands'],
    [['ask', "Give me today's briefing"], 'Executive Briefing'],
    [['briefing'], 'Top 3 Priorities'],
    [['control'], 'Control Tower status'],
    [['health'], 'Data health'],
    [['approvals'], 'pending approvals'],
    [['audit'], 'operator_request_received'],
  ])('%j works without credentials', (args, marker) => {
    const result = runCli(args);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(marker);
    expect(result.stdout).toContain('## Source Mode');
    expect(result.stdout).toContain('## Requires Approval');
    expect(result.stdout).toContain('auditId: audit-');
    expect(result.stdout).not.toContain('agent_audit');
  });
});
