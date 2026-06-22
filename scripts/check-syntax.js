const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const roots = ['src', 'tests', 'scripts'];
const failures = [];

const walk = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.isFile() && fullPath.endsWith('.js') ? [fullPath] : [];
  });
};

const files = roots.flatMap(walk);

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    failures.push({ file, output: result.stderr || result.stdout });
  }
}

if (failures.length) {
  failures.forEach((failure) => {
    console.error(`Syntax check failed: ${failure.file}`);
    console.error(failure.output);
  });
  process.exit(1);
}

console.log(`Syntax check passed for ${files.length} JavaScript files.`);
