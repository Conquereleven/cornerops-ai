process.env.CORNEROPS_BUSINESS_DATA_DRY_RUN = 'true';
process.env.CORNEROPS_DB_ALLOW_WRITES = 'false';
process.env.CORNEROPS_DB_READ_ONLY = 'true';
process.env.CORNEROPS_INTERNAL_BETA_ENABLED = 'true';

const { controlTowerService } = require('../src/core/control-tower');

controlTowerService.getBetaReport()
  .then((report) => console.log(JSON.stringify(report, null, 2)))
  .catch((error) => {
    console.error(JSON.stringify({ status: 'unhealthy', error: error.message }));
    process.exitCode = 1;
  });
