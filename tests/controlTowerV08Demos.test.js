const fs = require('fs');
const { run: runWeb } = require('../scripts/control-tower-web-report');
const { run: runApprovals } = require('../scripts/demo-approval-center');
const { run: runAudit } = require('../scripts/demo-audit-viewer');
const { run: runV08 } = require('../scripts/demo-v0.8');

describe('Control Tower v0.8 demos', () => {
  let log;
  beforeEach(() => { log = jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => log.mockRestore());

  test('web report runs without credentials and contains no secret fields', async () => {
    const { outputPath } = await runWeb();
    const html = fs.readFileSync(outputPath, 'utf8');
    expect(html).toContain('Control Tower v0.8');
    expect(html).toContain('This report cannot execute actions');
    expect(html).not.toMatch(/AUTH_TOKEN|BOT_TOKEN|SERVICE_ROLE_KEY/);
  });

  test('Approval Center demo approves and rejects without execution', async () => {
    const result = await runApprovals();
    expect(result.approved.executed).toBe(false);
    expect(result.rejected.executed).toBe(false);
  });

  test('Audit Viewer demo masks PII and secrets', async () => {
    const viewer = await runAudit();
    const serialized = JSON.stringify(viewer);
    expect(serialized).not.toContain('founder@example.com');
    expect(serialized).not.toContain('never-show-this');
  });

  test('combined v0.8 demo stays dry-run and produces a local report', async () => {
    const result = await runV08();
    expect(result.report.safety).toMatchObject({ writesBlocked: true, externalSendsBlocked: true });
    expect(fs.existsSync(result.outputPath)).toBe(true);
  });
});
