#!/usr/bin/env node
const { main } = require('./cornermex-supabase-readonly-check');

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerMex Supabase read-only check failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
