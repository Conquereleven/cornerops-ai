const routerAgent = require('./cornerops-router-agent');
const dailyBriefingAgent = require('./daily-briefing-agent');
const b2bSalesAgent = require('./b2b-sales-agent');
const quotesOrdersAgent = require('./quotes-orders-agent');
const devCodexGithubAgent = require('./dev-codex-github-agent');
const securityAuditAgent = require('./security-audit-agent');

const coreAgentDefinitions = Object.freeze([
  routerAgent,
  dailyBriefingAgent,
  b2bSalesAgent,
  quotesOrdersAgent,
  devCodexGithubAgent,
  securityAuditAgent,
]);

module.exports = {
  b2bSalesAgent,
  coreAgentDefinitions,
  dailyBriefingAgent,
  devCodexGithubAgent,
  quotesOrdersAgent,
  routerAgent,
  securityAuditAgent,
};
