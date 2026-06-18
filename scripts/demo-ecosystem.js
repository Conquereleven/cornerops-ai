process.env.OPENCLAW_ECOSYSTEM_ENABLED = 'true';
process.env.CRABOX_ENABLED = 'true';
process.env.OCTOPOOL_ENABLED = 'true';
process.env.CLAWHUB_ENABLED = 'true';
process.env.LOBSTER_ENABLED = 'true';
process.env.CRABOX_DRY_RUN = 'true';
process.env.OCTOPOOL_DRY_RUN = 'true';
process.env.LOBSTER_DRY_RUN = 'true';

const dataCore = require('../src/core/data');

const run = async () => {
  console.log('CornerOps OpenClaw ecosystem demo (dry run)');
  console.log('\nServices');
  console.log(JSON.stringify(dataCore.ecosystemRegistry.list(), null, 2));
  console.log('\nCrabox dry run');
  console.log(JSON.stringify(await dataCore.craboxRunnerAdapter.runSuite({
    suite: 'unit',
    diffId: 'demo-diff',
  }, {
    agentId: 'dev-codex-github-agent',
    userId: 'demo-operator',
    channel: 'internal',
    requestId: 'demo-ecosystem-crabox',
  }), null, 2));
  console.log('\nOctopool relay summary');
  console.log(JSON.stringify(await dataCore.octopoolRelay.getRepositorySummary({}, {
    agentId: 'dev-codex-github-agent',
  }), null, 2));
  console.log('\nApproved skills');
  console.log(JSON.stringify(await dataCore.clawhubSkillRegistryAdapter.listApprovedSkills({
    agentId: 'security-audit-agent',
  }), null, 2));
  console.log('\nSkill review proposal');
  console.log(JSON.stringify(await dataCore.clawhubSkillRegistryAdapter.proposeSkillForReview({
    id: 'skill-demo-command',
    name: 'Demo command skill',
    permissions: ['command_execution'],
  }, {
    agentId: 'security-audit-agent',
  }), null, 2));
  console.log('\nLobster workflow dry run');
  console.log(JSON.stringify(await dataCore.lobsterWorkflowShellAdapter.dryRunWorkflow({
    workflowId: 'daily-briefing.workflow',
  }, {
    agentId: 'daily-briefing-agent',
  }), null, 2));
  console.log('\nCrabfleet');
  console.log(JSON.stringify(await dataCore.crabfleetMissionControlAdapter.listMissions(), null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
