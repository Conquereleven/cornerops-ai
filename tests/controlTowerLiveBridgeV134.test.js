const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  generateToken,
  hash,
  writeLocalToken,
} = require('../scripts/control-tower-frontend-token-hash');

const root = path.resolve(__dirname, '..');
const nodeBin = process.execPath;

describe('Control Tower live bridge activation v1.3.4', () => {
  test('token generator creates high-entropy local token without printing raw token', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cornerops-generated-token-'));
    const generatedPath = path.join(dir, 'control-tower-token.txt');
    const output = execFileSync(nodeBin, ['scripts/control-tower-frontend-token-hash.js', '--generate'], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        CONTROL_TOWER_FRONTEND_TOKEN_PATH: generatedPath,
      },
    });
    const secretPath = output.match(/^localTokenPath=(.+)$/m)?.[1];
    expect(secretPath).toBe(generatedPath);
    const token = fs.readFileSync(secretPath, 'utf8').trim();
    expect(token.length).toBeGreaterThanOrEqual(48);
    expect(output).not.toContain(token);
    expect(output).toContain('CONTROL_TOWER_FRONTEND_TOKEN_HASH=sha256:');
    expect(output).toContain(`sha256:${hash(token)}`);
  });

  test('local secret path is gitignored', () => {
    const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
    expect(gitignore).toContain('.cornerops/local-secrets/');
  });

  test('writeLocalToken stores owner-only file when supported', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cornerops-token-'));
    const filePath = path.join(dir, 'token.txt');
    const token = generateToken();
    writeLocalToken(token, filePath);
    expect(fs.readFileSync(filePath, 'utf8').trim()).toBe(token);
    const mode = fs.statSync(filePath).mode & 0o777;
    expect([0o600, 0o644]).toContain(mode);
  });
});
