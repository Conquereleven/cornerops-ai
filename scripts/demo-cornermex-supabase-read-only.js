#!/usr/bin/env node
const { main: runCheck } = require('./cornermex-supabase-read-only-check');

if (require.main === module) {
  runCheck();
}

module.exports = { main: runCheck };
