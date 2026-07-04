const crypto = require('crypto');
const readline = require('readline');

const hash = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex');

const tokenFromEnv = process.env.CONTROL_TOWER_FRONTEND_OPERATOR_TOKEN || '';

const printHash = (token) => {
  if (!token) {
    process.stderr.write('Missing operator token. Set CONTROL_TOWER_FRONTEND_OPERATOR_TOKEN or paste it when prompted.\n');
    process.exitCode = 1;
    return;
  }
  process.stdout.write('CONTROL_TOWER_FRONTEND_TOKEN_HASH=sha256:');
  process.stdout.write(`${hash(token)}\n`);
  process.stdout.write('Store only the hash in .env. Never commit .env or paste the raw token into GitHub/Lovable.\n');
};

if (tokenFromEnv) {
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

module.exports = { hash };
