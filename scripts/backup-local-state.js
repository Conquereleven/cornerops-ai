#!/usr/bin/env node
const controlTower = require('../src/core/control-tower');

const main = () => {
  const result = controlTower.localStateBackupService.createBackup();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`Local state backup failed safely: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main };
