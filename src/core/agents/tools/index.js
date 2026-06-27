const fs = require('fs');
const path = require('path');
const {
  contextFromInput,
  deniedResult,
  dryRunProposal,
  evaluateDataRead,
  readResult,
} = require('./toolUtils');

const createAgentTools = (deps) => {
  const read = async ({ sourceId, toolName, input, agentId, loader }) => {
    const policy = evaluateDataRead({
      dataAccessPolicy: deps.dataAccessPolicy,
      dataSourceRegistry: deps.dataSourceRegistry,
      input,
      agentId,
      sourceId,
    });
    if (!policy.allowed) return deniedResult(toolName, policy);
    const data = await loader(contextFromInput(input, agentId));
    const source = deps.dataSourceRegistry.get(sourceId);
    const sourceMode = source?.mode === 'read_only' ? 'real_read_only' : 'mock';
    return readResult(toolName, data, sourceMode);
  };

  return {
    readLeadsTool: (input, agentId) => read({
      sourceId: 'leads',
      toolName: 'readLeadsTool',
      input,
      agentId,
      loader: (context) => deps.businessDataService.listLeads({}, context),
    }),
    readLeadByIdTool: (input, agentId) => read({
      sourceId: 'leads',
      toolName: 'readLeadByIdTool',
      input,
      agentId,
      loader: (context) => deps.businessDataService.getLeadById(input.metadata?.leadId || input.leadId, context),
    }),
    readLeadsNeedingFollowUpTool: (input, agentId) => read({
      sourceId: 'leads',
      toolName: 'readLeadsNeedingFollowUpTool',
      input,
      agentId,
      loader: (context) => deps.businessDataService.findLeadsNeedingFollowUp(context),
    }),
    readQuotesTool: (input, agentId) => read({
      sourceId: 'quotes',
      toolName: 'readQuotesTool',
      input,
      agentId,
      loader: (context) => deps.businessDataService.listQuotes({}, context),
    }),
    readQuotesNeedingFollowUpTool: (input, agentId) => read({
      sourceId: 'quotes',
      toolName: 'readQuotesNeedingFollowUpTool',
      input,
      agentId,
      loader: (context) => deps.businessDataService.findQuotesNeedingFollowUp(context),
    }),
    readQuotesByLeadTool: (input, agentId) => read({
      sourceId: 'quotes',
      toolName: 'readQuotesByLeadTool',
      input,
      agentId,
      loader: (context) => deps.businessDataService.findQuotesByLeadId(input.metadata?.leadId, context),
    }),
    readOrdersTool: (input, agentId) => read({
      sourceId: 'orders',
      toolName: 'readOrdersTool',
      input,
      agentId,
      loader: (context) => deps.businessDataService.listOrders({}, context),
    }),
    readOrdersRequiringActionTool: (input, agentId) => read({
      sourceId: 'orders',
      toolName: 'readOrdersRequiringActionTool',
      input,
      agentId,
      loader: (context) => deps.businessDataService.findOrdersRequiringAction(context),
    }),
    readManualPaymentOrdersTool: (input, agentId) => read({
      sourceId: 'orders',
      toolName: 'readManualPaymentOrdersTool',
      input,
      agentId,
      loader: (context) => deps.businessDataService.findManualPaymentOrders(context),
    }),
    readGitHubIssuesTool: (input, agentId) => read({
      sourceId: 'github',
      toolName: 'readGitHubIssuesTool',
      input,
      agentId,
      loader: (context) => deps.githubIssueService.listIssues({ state: 'open' }, context),
    }),
    readGitHubPullRequestsTool: (input, agentId) => read({
      sourceId: 'github',
      toolName: 'readGitHubPullRequestsTool',
      input,
      agentId,
      loader: (context) => deps.githubPullRequestService.listPullRequests({ state: 'open' }, context),
    }),
    readGitHubActionsStatusTool: (input, agentId) => read({
      sourceId: 'github',
      toolName: 'readGitHubActionsStatusTool',
      input,
      agentId,
      loader: (context) => deps.githubActionsService.listWorkflowRuns({}, context),
    }),
    readAuditLogsTool: (input, agentId) => read({
      sourceId: 'audit_logs',
      toolName: 'readAuditLogsTool',
      input,
      agentId,
      loader: () => deps.auditLogService.list({ limit: 50 }),
    }),
    readApprovalLogsTool: (input, agentId) => read({
      sourceId: 'approvals',
      toolName: 'readApprovalLogsTool',
      input,
      agentId,
      loader: () => deps.approvalService.listApprovals({ limit: 50 }),
    }),
    readDataHealthTool: async () => readResult('readDataHealthTool', await deps.dataHealthService.getReport(), 'internal'),
    readBusinessDataHealthTool: async (input, agentId) => readResult(
      'readBusinessDataHealthTool',
      await deps.businessDataService.getHealth(contextFromInput(input, agentId)),
      'internal',
    ),
    readSchemaDiscoveryTool: async (input, agentId) => {
      await deps.businessDataService.ensureReady(contextFromInput(input, agentId));
      return readResult('readSchemaDiscoveryTool', deps.businessDataService.getSchemaReport(), 'internal');
    },
    readDataContractsTool: async (input, agentId) => {
      await deps.businessDataService.ensureReady(contextFromInput(input, agentId));
      return readResult('readDataContractsTool', deps.businessDataService.getDataContracts(), 'internal');
    },
    readCornerMexConnectorStatusTool: async (input, agentId) => readResult(
      'readCornerMexConnectorStatusTool',
      await deps.lovableCornerMexConnector.getConnectorStatus(contextFromInput(input, agentId)),
      'internal',
    ),
    readCornerMexProductsTool: async (input, agentId) => {
      const result = await deps.lovableCornerMexConnector.listProducts({ limit: 10 }, contextFromInput(input, agentId));
      return readResult('readCornerMexProductsTool', result, result.meta?.source || 'mock');
    },
    readCornerMexLeadsTool: async (input, agentId) => {
      const result = await deps.lovableCornerMexConnector.listLeads({ limit: 10 }, contextFromInput(input, agentId));
      return readResult('readCornerMexLeadsTool', result, result.meta?.source || 'mock');
    },
    readCornerMexQuotesTool: async (input, agentId) => {
      const result = await deps.lovableCornerMexConnector.listQuotes({ limit: 10 }, contextFromInput(input, agentId));
      return readResult('readCornerMexQuotesTool', result, result.meta?.source || 'mock');
    },
    readCornerMexOrdersTool: async (input, agentId) => {
      const result = await deps.lovableCornerMexConnector.listOrders({ limit: 10 }, contextFromInput(input, agentId));
      return readResult('readCornerMexOrdersTool', result, result.meta?.source || 'mock');
    },
    readOperationalDocsTool: async () => {
      const docs = [
        'docs/audits/qa-status-v0.3.md',
        'docs/beta/internal-beta-readiness-v0.3.md',
        'docs/beta/internal-beta-readiness-v0.4.md',
        'docs/audits/business-data-readiness-v0.4.md',
        'docs/beta/internal-beta-scope-v0.4.md',
      ].map((relativePath) => {
        const absolutePath = path.resolve(process.cwd(), relativePath);
        if (!fs.existsSync(absolutePath)) return { path: relativePath, available: false };
        const content = fs.readFileSync(absolutePath, 'utf8');
        return {
          path: relativePath,
          available: true,
          headings: content.split('\n').filter((line) => line.startsWith('#')).slice(0, 12),
        };
      });
      return readResult('readOperationalDocsTool', docs, 'internal');
    },
    readOpenClawEcosystemServicesTool: async () => readResult('readOpenClawEcosystemServicesTool', deps.ecosystemRegistry.list(), 'internal'),
    readApprovedClawHubSkillsTool: (input, agentId) =>
      deps.clawhubSkillRegistryAdapter.listApprovedSkills(contextFromInput(input, agentId))
        .then((skills) => readResult('readApprovedClawHubSkillsTool', skills, 'mock')),
    proposeLeadFollowUpTool: (input) => Promise.resolve(dryRunProposal('proposeLeadFollowUpTool', {
      leadId: input.metadata?.leadId,
      message: 'Follow-up draft pending operator review.',
    })),
    draftB2BMessageTool: (input) => Promise.resolve(dryRunProposal('draftB2BMessageTool', {
      channel: input.channel,
      draft: `Hola, gracias por tu interes. Puedo preparar una cotizacion en draft con datos confirmados para: ${input.text}`,
    })),
    draftQuoteFollowUpTool: (input) => Promise.resolve(dryRunProposal('draftQuoteFollowUpTool', {
      draft: `Follow-up de quote preparado como borrador: ${input.text}`,
    })),
    proposeOrderStatusChangeTool: (input) => Promise.resolve(dryRunProposal('proposeOrderStatusChangeTool', {
      orderId: input.metadata?.orderId,
      proposedStatus: input.metadata?.status || 'requires_operator_selection',
    }, 'Order status change requires approval.')),
    proposeManualPaymentMarkPaidTool: (input) => Promise.resolve(dryRunProposal('proposeManualPaymentMarkPaidTool', {
      orderId: input.metadata?.orderId,
      proposedPaymentStatus: 'paid',
    }, 'Manual payment mark-paid requires approval.')),
    createGitHubIssueDraftTool: (input) => deps.githubIssueService.createIssueDraft({
      title: input.metadata?.title || 'CornerOps follow-up issue draft',
      body: input.text,
      labels: ['cornerops', 'draft'],
      requestId: input.requestId,
    }),
    createGitHubPRSummaryTool: (input) => Promise.resolve(dryRunProposal('createGitHubPRSummaryTool', {
      summary: `PR summary draft for: ${input.text}`,
    })),
    createSecurityAuditReportTool: async (input, agentId) => {
      const [audit, health] = await Promise.all([
        deps.auditLogService.list({ limit: 50 }),
        deps.dataHealthService.getReport(),
      ]);
      return readResult('createSecurityAuditReportTool', {
        rejectedActions: audit.filter((log) => log.status === 'denied').length,
        pendingApprovals: (await deps.approvalService.listPendingApprovals({ limit: 50 })).length,
        healthStatus: health.status,
        agentId,
      }, 'internal');
    },
    proposeClawHubSkillReviewTool: (input, agentId) =>
      deps.clawhubSkillRegistryAdapter.proposeSkillForReview(input.metadata?.skill || {}, contextFromInput(input, agentId)),
    proposeLobsterWorkflowTool: (input, agentId) =>
      deps.lobsterWorkflowShellAdapter.proposeWorkflow(input.metadata?.workflow || {}, contextFromInput(input, agentId)),
    createGitHubIssueTool: (input) => deps.githubIssueService.createIssue({
      title: input.metadata?.title || 'CornerOps issue proposal',
      body: input.text,
      labels: ['cornerops'],
      requestId: input.requestId,
      userId: input.userId,
      channel: input.channel,
    }, input.metadata?.approvalId),
    updateLeadStatusTool: (input) => Promise.resolve(dryRunProposal('updateLeadStatusTool', input.metadata || {}, 'Lead status update is approval-required and not executed.')),
    addLeadNoteTool: (input) => Promise.resolve(dryRunProposal('addLeadNoteTool', input.metadata || {}, 'Lead note is approval-required and not executed.')),
    addQuoteNoteTool: (input) => Promise.resolve(dryRunProposal('addQuoteNoteTool', input.metadata || {}, 'Quote note is approval-required and not executed.')),
    addOrderInternalNoteTool: (input) => Promise.resolve(dryRunProposal('addOrderInternalNoteTool', input.metadata || {}, 'Order note is approval-required and not executed.')),
    requestOrderStatusChangeTool: (input) => Promise.resolve(dryRunProposal('requestOrderStatusChangeTool', input.metadata || {}, 'Order status request captured only as dry run.')),
    requestManualPaymentMarkPaidTool: (input) => Promise.resolve(dryRunProposal('requestManualPaymentMarkPaidTool', input.metadata || {}, 'Manual payment mark-paid request captured only as dry run.')),
    approveClawHubSkillTool: (input, agentId) =>
      deps.clawhubSkillRegistryAdapter.approveSkill(input.metadata?.skill || {}, contextFromInput(input, agentId)),
    disableClawHubSkillTool: (input, agentId) =>
      deps.clawhubSkillRegistryAdapter.disableSkill(input.metadata?.skill || {}, contextFromInput(input, agentId)),
    runCraboxSuiteTool: (input, agentId) =>
      deps.craboxRunnerAdapter.runSuite(input.metadata?.crabox || {}, contextFromInput(input, agentId)),
    runLobsterWorkflowTool: (input, agentId) =>
      deps.lobsterWorkflowShellAdapter.dryRunWorkflow(input.metadata?.workflow || {}, contextFromInput(input, agentId)),
  };
};

module.exports = {
  createAgentTools,
};
