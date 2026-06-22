process.env.CORNEROPS_DRY_RUN = 'true';
process.env.CORNEROPS_REAL_SOURCE_ONBOARDING_ENABLED = 'false';
process.env.GITHUB_ENABLED = 'false';
process.env.OPENCLAW_ENABLED = 'false';

const { controlTowerService } = require('../src/core/control-tower');

const run = async () => {
  console.log('CornerOps Control Tower v0.3 (safe local report)');
  console.log(JSON.stringify(await controlTowerService.getReport(), null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
