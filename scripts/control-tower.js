const { controlTowerService } = require('../src/core/control-tower');

controlTowerService.getReport()
  .then((report) => console.log(JSON.stringify(report, null, 2)))
  .catch((error) => {
    console.error(JSON.stringify({ status: 'unhealthy', error: error.message }));
    process.exitCode = 1;
  });
