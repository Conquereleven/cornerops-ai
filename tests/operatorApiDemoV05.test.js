const path = require('path');
const { spawnSync } = require('child_process');
const request = require('supertest');
const app = require('../src/app');

describe('Operator API gate and interactive demo v0.5', () => {
  test('operator API is disabled by default', async () => {
    await request(app).post('/api/operator/ask')
      .send({ text: 'help' })
      .expect(404)
      .expect((res) => expect(res.body.message).toBe('Operator API is disabled.'));
  });

  test('interactive beta demo runs without credentials', () => {
    const result = spawnSync(process.execPath, ['scripts/demo-interactive-beta.js'], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      env: { ...process.env, CORNEROPS_BUSINESS_DATA_ENABLED: 'false', OPENCLAW_ENABLED: 'false' },
      maxBuffer: 2 * 1024 * 1024,
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('CornerOps Interactive Operator Beta v0.5');
    expect(result.stdout).toContain('=== 11. Security risks ===');
    expect(result.stdout).toContain('## Source Mode');
    expect(result.stdout).toContain('auditId: audit-');
  });
});
