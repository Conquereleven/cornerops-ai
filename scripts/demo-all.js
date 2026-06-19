const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const demos = [
  'scripts/demo-agents.js',
  'scripts/demo-real-data.js',
  'scripts/demo-business-data.js',
  'scripts/control-tower-beta.js',
  'scripts/demo-interactive-beta.js',
  'scripts/demo-operator-channel.js',
  'scripts/demo-ecosystem.js',
  'scripts/demo-context.js',
  'scripts/demo-context-health.js',
];

for (const demo of demos) {
  console.log(`\n[demo:all] ${demo}`);
  const result = spawnSync(process.execPath, [demo], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    break;
  }
}
