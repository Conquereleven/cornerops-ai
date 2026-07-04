const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const hash = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex');

const tokenFromEnv = process.env.CONTROL_TOWER_FRONTEND_OPERATOR_TOKEN || '';
const localSecretPath = path.resolve(
  process.cwd(),
  process.env.CONTROL_TOWER_FRONTEND_TOKEN_PATH || '.cornerops/local-secrets/control-tower-frontend-token.txt',
);

const generateToken = () => crypto.randomBytes(48).toString('base64url');

const writeLocalToken = (token, filePath = localSecretPath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(filePath, `${token}\n`, { mode: 0o600 });
  try {
    fs.chmodSync(filePath, 0o600);
  } catch (_error) {
    // Best effort on platforms that do not support chmod semantics.
  }
  return filePath;
};

const printHash = (token, options = {}) => {
  if (!token) {
    process.stderr.write('Missing operator token. Set CONTROL_TOWER_FRONTEND_OPERATOR_TOKEN or paste it when prompted.\n');
    process.exitCode = 1;
    return;
  }
  if (options.filePath) {
    process.stdout.write(`localTokenPath=${options.filePath}\n`);
    process.stdout.write(`tokenLength=${String(token).length}\n`);
    process.stdout.write(`tokenPreview=${String(token).slice(0, 4)}...[redacted]\n`);
  }
  process.stdout.write('CONTROL_TOWER_FRONTEND_TOKEN_HASH=sha256:');
  process.stdout.write(`${hash(token)}\n`);
  process.stdout.write('Store only the hash in .env. Never commit .env or paste the raw token into GitHub/Lovable.\n');
};

if (require.main === module) {
  if (process.argv.includes('--generate')) {
    const token = generateToken();
    const filePath = writeLocalToken(token);
    printHash(token, { filePath });
  } else if (tokenFromEnv) {
    printHash(tokenFromEnv);
  } else if (process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Paste operator token locally (input is not stored): ', (token) => {
      rl.close();
      printHash(token.trim());
    });
  } else {
    let input = '';
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => printHash(input.trim()));
  }
}

module.exports = {
  generateToken,
  hash,
  localSecretPath,
  writeLocalToken,
};
