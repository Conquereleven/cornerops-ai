process.env.CORNEROPS_DRY_RUN = 'true';
process.env.CORNEROPS_REAL_SOURCE_ONBOARDING_ENABLED = 'false';
process.env.CRAWLERS_ENABLED = 'false';
process.env.GITHUB_ENABLED = 'false';
process.env.GITHUB_DRY_RUN = 'true';
process.env.GITHUB_READ_ONLY = 'true';
process.env.OPENCLAW_ENABLED = 'false';
process.env.OPENCLAW_ECOSYSTEM_ENABLED = 'false';

const { agentOrchestrator } = require('../src/core/agents');
const contextCore = require('../src/core/context');
const dataCore = require('../src/core/data');
const { controlTowerService } = require('../src/core/control-tower');

const scenarios = [
  ['daily briefing', 'Give me today\'s operational briefing.'],
  ['B2B follow-up', 'Find leads that need follow-up and prepare draft messages.'],
  ['quotes/orders', 'Which orders require action?'],
  ['GitHub engineering', 'Review open GitHub issues and propose next engineering tasks.'],
  ['security review', 'Review denied actions and high-risk tool attempts.'],
];

const run = async () => {
  console.log('CornerOps internal beta demo v0.3 (mock/read-only/dry-run)');
  console.log('\nControl Tower');
  console.log(JSON.stringify(await controlTowerService.getReport(), null, 2));
  console.log('\nData health');
  console.log(JSON.stringify(await dataCore.dataHealthService.getReport(), null, 2));
  console.log('\nContext health');
  console.log(JSON.stringify(await contextCore.contextHealthService.getReport(), null, 2));
  for (const [name, text] of scenarios) {
    const result = await agentOrchestrator.handleMessage({
      conversationId: 'demo-beta-v0.3',
      userId: 'demo-beta-operator',
      channel: 'internal',
      text,
    });
    console.log(`\n${name}`);
    console.log(JSON.stringify({
      agentId: result.agentId,
      status: result.status,
      requiresApproval: result.status === 'needs_approval',
      metrics: result.dataSnapshot?.metrics || {},
    }, null, 2));
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
