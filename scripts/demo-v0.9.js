const { run: runActions } = require('./demo-controlled-actions');
const { run: runGitHub } = require('./demo-github-issue-action');
const { run: runInternal } = require('./demo-internal-notes-tasks');

const run = async () => {
  const controlled = await runActions();
  const github = await runGitHub();
  const internal = await runInternal();
  const result = {
    version: 'v0.9',
    controlTower: 'controlled actions visible',
    devCodexGitHubProposal: github.draft,
    approvalDryRun: github.executionStatus,
    internalTask: internal.task.sourceMode,
    securityAuditEvents: controlled.auditEvents,
    blockedMutation: 'payments/orders/leads/quotes denied',
    safety: {
      credentialsUsed: false,
      realGitHubIssueCreated: false,
      businessDatabaseWrites: internal.businessDatabaseWrites,
      externalSideEffects: controlled.externalSideEffects,
    },
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
};

if (require.main === module) run().catch((error) => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
module.exports = { run };
