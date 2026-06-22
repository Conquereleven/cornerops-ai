process.env.CORNEROPS_CLI_MODE = 'true';
process.env.CORNEROPS_FIRST_REAL_SOURCE_ENABLED = 'true';
process.env.CORNEROPS_FIRST_REAL_SOURCE = 'auto';
process.env.CORNEROPS_FIRST_REAL_SOURCE_MODE = 'read_only';
process.env.CORNEROPS_BUSINESS_DATA_ENABLED = 'false';
process.env.GITHUB_ENABLED = 'false';
process.env.GITHUB_TOKEN = '';
process.env.READONLY_DATABASE_URL = '';
process.env.SUPABASE_READONLY_KEY = '';

const { firstRealSourceReadinessService } = require('../src/core/data');

firstRealSourceReadinessService.getReport().then((report) => {
  console.log('CornerOps First Real Source v0.7');
  console.log(`Selected source: ${report.selectedSource}`);
  console.log(`Mode: ${report.mode}`);
  console.log(`Read-only verified: ${report.readOnlyVerified}`);
  console.log(`Business DB: ${report.businessDb.mode}; credentials=${report.businessDb.credentialsPresent}`);
  console.log(`GitHub: ${report.github.mode}; credentials=${report.github.credentialsPresent}`);
  report.warnings.forEach((warning) => console.log(`Warning: ${warning}`));
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
