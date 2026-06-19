const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const checks = [
  ['lint', root, ['scripts/check-syntax.js']],
  ['typecheck', frontend, ['node_modules/typescript/bin/tsc', '--noEmit']],
  ['backend tests', root, ['node_modules/jest/bin/jest.js', '--runInBand']],
  ['frontend tests', frontend, ['node_modules/vitest/vitest.mjs', 'run']],
  ['build', frontend, ['node_modules/vite/bin/vite.js', 'build']],
];

for (const [name, cwd, args] of checks) {
  console.log(`\n[qa] ${name}`);
  const result = spawnSync(process.execPath, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    break;
  }
}
