const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const hash = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex');
const generateToken = () => crypto.randomBytes(48).toString('base64url');
const localSecretPath = path.resolve(
  process.cwd(),
  process.env.CONTROL_TOWER_FOUNDER_ACTION_TOKEN_PATH
    || '.cornerops/local-secrets/control-tower-founder-action-token.txt',
);

const writeLocalToken = (token) => {
  fs.mkdirSync(path.dirname(localSecretPath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(localSecretPath, `${token}\n`, { mode: 0o600 });
  fs.chmodSync(localSecretPath, 0o600);
};

if (require.main === module) {
  if (!process.argv.includes('--generate')) {
    process.stderr.write('Use --generate. The plaintext token will be written to the ignored local-secrets directory and never printed.\n');
    process.exitCode = 1;
  } else {
    const token = generateToken();
    writeLocalToken(token);
    process.stdout.write(`localTokenPath=${localSecretPath}\n`);
    process.stdout.write(`CONTROL_TOWER_FOUNDER_ACTION_TOKEN_HASH=sha256:${hash(token)}\n`);
    process.stdout.write('The plaintext token was not printed. Keep it session-only in the Control Tower.\n');
  }
}

module.exports = { generateToken, hash, localSecretPath, writeLocalToken };
