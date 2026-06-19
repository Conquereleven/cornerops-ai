const orderRepository = require('../data/repositories/orderRepository');
const productRepository = require('../data/repositories/productRepository');
const leadRepository = require('../data/repositories/leadRepository');
const conversationRepository = require('../data/repositories/conversationRepository');
const operationsRepository = require('../data/repositories/operationsRepository');
const aiWorkerRunRepository = require('../data/repositories/aiWorkerRunRepository');
const customerRepository = require('../data/repositories/customerRepository');
const workerEventService = require('../services/workerEventService');
const dataCore = require('../core/data');

const listOrders = async (req, res, next) => {
  try {
    return res.json(await orderRepository.listOrders({
      limit: req.query.limit,
      status: req.query.status,
    }));
  } catch (error) {
    return next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await orderRepository.findOrderById(req.params.orderNumber);
    if (!order) return res.status(404).json({ error: true, message: 'Order not found' });
    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const products = req.query.q
      ? await productRepository.searchProducts(req.query.q)
      : await productRepository.listProducts({
          limit: req.query.limit,
          category: req.query.category,
          b2bAvailable: req.query.b2bAvailable,
          lowStock: req.query.lowStock,
        });
    return res.json(products);
  } catch (error) {
    return next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await productRepository.getProductBySku(req.params.sku);
    if (!product) {
      return res.status(404).json({ error: true, message: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    return next(error);
  }
};

const listLeads = async (req, res, next) => {
  try {
    return res.json(await leadRepository.listLeads({
      limit: req.query.limit,
      status: req.query.status,
    }));
  } catch (error) {
    return next(error);
  }
};

const listLeadsFollowUp = async (req, res, next) => {
  try {
    return res.json(await dataCore.leadService.findLeadsNeedingFollowUp({
      requestId: req.get('x-request-id'),
      userId: 'api',
      channel: 'web',
      agentId: 'b2b-sales-agent',
    }));
  } catch (error) {
    return next(error);
  }
};

const listQuotes = async (req, res, next) => {
  try {
    return res.json(await dataCore.quoteService.listQuotes({}, {
      requestId: req.get('x-request-id'),
      userId: 'api',
      channel: 'web',
      agentId: 'quotes-orders-agent',
    }));
  } catch (error) {
    return next(error);
  }
};

const getQuote = async (req, res, next) => {
  try {
    const quote = await dataCore.quoteService.getQuoteById(req.params.id, {
      requestId: req.get('x-request-id'),
      userId: 'api',
      channel: 'web',
      agentId: 'quotes-orders-agent',
    });
    if (!quote) return res.status(404).json({ error: true, message: 'Quote not found' });
    return res.json(quote);
  } catch (error) {
    return next(error);
  }
};

const listQuotesFollowUp = async (req, res, next) => {
  try {
    return res.json(await dataCore.quoteService.findQuotesNeedingFollowUp({
      requestId: req.get('x-request-id'),
      userId: 'api',
      channel: 'web',
      agentId: 'quotes-orders-agent',
    }));
  } catch (error) {
    return next(error);
  }
};

const listOrdersRequiringAction = async (req, res, next) => {
  try {
    return res.json(await dataCore.orderService.findOrdersRequiringAction({
      requestId: req.get('x-request-id'),
      userId: 'api',
      channel: 'web',
      agentId: 'quotes-orders-agent',
    }));
  } catch (error) {
    return next(error);
  }
};

const listManualPaymentOrders = async (req, res, next) => {
  try {
    return res.json(await dataCore.orderService.findManualPaymentOrders({
      requestId: req.get('x-request-id'),
      userId: 'api',
      channel: 'web',
      agentId: 'quotes-orders-agent',
    }));
  } catch (error) {
    return next(error);
  }
};

const listGitHubIssues = async (req, res, next) => {
  try {
    return res.json(await dataCore.githubIssueService.listIssues({ state: req.query.state || 'open' }, {
      requestId: req.get('x-request-id'),
      userId: 'api',
      channel: 'web',
      agentId: 'dev-codex-github-agent',
    }));
  } catch (error) {
    return next(error);
  }
};

const getGitHubIssue = async (req, res, next) => {
  try {
    const issue = await dataCore.githubIssueService.getIssue(req.params.number, {
      requestId: req.get('x-request-id'), userId: 'api', channel: 'web', agentId: 'dev-codex-github-agent',
    });
    if (!issue) return res.status(404).json({ error: true, message: 'GitHub issue not found' });
    return res.json(issue);
  } catch (error) {
    return next(error);
  }
};

const listGitHubPullRequests = async (req, res, next) => {
  try {
    return res.json(await dataCore.githubPullRequestService.listPullRequests({ state: req.query.state || 'open' }, {
      requestId: req.get('x-request-id'),
      userId: 'api',
      channel: 'web',
      agentId: 'dev-codex-github-agent',
    }));
  } catch (error) {
    return next(error);
  }
};

const getGitHubPullRequest = async (req, res, next) => {
  try {
    const pullRequest = await dataCore.githubPullRequestService.getPullRequest(req.params.number, {
      requestId: req.get('x-request-id'), userId: 'api', channel: 'web', agentId: 'dev-codex-github-agent',
    });
    if (!pullRequest) return res.status(404).json({ error: true, message: 'GitHub pull request not found' });
    return res.json(pullRequest);
  } catch (error) {
    return next(error);
  }
};

const listGitHubWorkflowRuns = async (req, res, next) => {
  try {
    return res.json(await dataCore.githubActionsService.listWorkflowRuns({}, {
      requestId: req.get('x-request-id'),
      userId: 'api',
      channel: 'web',
      agentId: 'dev-codex-github-agent',
    }));
  } catch (error) {
    return next(error);
  }
};

const getGitHubWorkflowRun = async (req, res, next) => {
  try {
    const run = await dataCore.githubActionsService.getWorkflowRun(req.params.id, {
      requestId: req.get('x-request-id'), userId: 'api', channel: 'web', agentId: 'dev-codex-github-agent',
    });
    if (!run) return res.status(404).json({ error: true, message: 'GitHub workflow run not found' });
    return res.json(run);
  } catch (error) {
    return next(error);
  }
};

const getGitHubRepository = async (req, res, next) => {
  try {
    return res.json(await dataCore.githubClient.getRepositoryMetadata({
      requestId: req.get('x-request-id'), userId: 'api', channel: 'web', agentId: 'dev-codex-github-agent',
    }));
  } catch (error) {
    return next(error);
  }
};

const createGitHubIssueDraft = async (req, res, next) => {
  try {
    return res.status(201).json(await dataCore.githubIssueService.createIssueDraft({
      ...req.body,
      requestId: req.get('x-request-id'),
    }));
  } catch (error) {
    return next(error);
  }
};

const createGitHubIssue = async (req, res, next) => {
  try {
    const result = await dataCore.githubIssueService.createIssue({
      ...req.body,
      requestId: req.get('x-request-id'),
      userId: req.body.userId || 'api',
      channel: 'web',
    }, req.body.approvalId);
    const statusCode = result.status === 'denied'
      ? 403
      : result.status === 'needs_approval' ? 202 : 201;
    return res.status(statusCode).json(result);
  } catch (error) {
    return next(error);
  }
};

const listAuditLogs = async (req, res, next) => {
  try {
    return res.json(await dataCore.auditLogService.list({ limit: req.query.limit }));
  } catch (error) {
    return next(error);
  }
};

const listApprovals = async (req, res, next) => {
  try {
    return res.json(await dataCore.approvalService.listApprovals({
      status: req.query.status,
      limit: req.query.limit,
    }));
  } catch (error) {
    return next(error);
  }
};

const createApproval = async (req, res, next) => {
  try {
    return res.status(201).json(await dataCore.approvalService.requestApproval({
      ...req.body,
      requestId: req.body.requestId || req.get('x-request-id'),
    }));
  } catch (error) {
    return next(error);
  }
};

const approveApproval = async (req, res, next) => {
  try {
    const approval = await dataCore.approvalService.approveApproval(req.params.id, req.body.approver || 'operator');
    if (!approval) return res.status(404).json({ error: true, message: 'Approval not found' });
    return res.json(approval);
  } catch (error) {
    return next(error);
  }
};

const rejectApproval = async (req, res, next) => {
  try {
    const approval = await dataCore.approvalService.rejectApproval(req.params.id, req.body.approver || 'operator');
    if (!approval) return res.status(404).json({ error: true, message: 'Approval not found' });
    return res.json(approval);
  } catch (error) {
    return next(error);
  }
};

const getDataHealth = async (req, res, next) => {
  try {
    return res.json(await dataCore.dataHealthService.getReport());
  } catch (error) {
    return next(error);
  }
};

const listOpenClawEcosystemServices = (req, res) =>
  res.json(dataCore.ecosystemRegistry.list());

const listOpenClawSkills = async (req, res, next) => {
  try {
    return res.json(await dataCore.clawhubSkillRegistryAdapter.listApprovedSkills({
      agentId: 'security-audit-agent',
      requestId: req.get('x-request-id'),
      userId: 'api',
      channel: 'web',
    }));
  } catch (error) {
    return next(error);
  }
};

const reviewOpenClawSkill = async (req, res, next) => {
  try {
    return res.status(202).json(await dataCore.clawhubSkillRegistryAdapter.proposeSkillForReview(req.body, {
      agentId: 'security-audit-agent',
      requestId: req.get('x-request-id'),
      userId: req.body.userId || 'api',
      channel: 'web',
    }));
  } catch (error) {
    return next(error);
  }
};

const approveOpenClawSkill = async (req, res, next) => {
  try {
    return res.status(202).json(await dataCore.clawhubSkillRegistryAdapter.approveSkill({
      id: req.params.id,
      ...req.body,
    }, {
      agentId: 'security-audit-agent',
      requestId: req.get('x-request-id'),
      userId: req.body.userId || 'api',
      channel: 'web',
    }));
  } catch (error) {
    return next(error);
  }
};

const disableOpenClawSkill = async (req, res, next) => {
  try {
    return res.status(202).json(await dataCore.clawhubSkillRegistryAdapter.disableSkill({
      id: req.params.id,
      ...req.body,
    }, {
      agentId: 'security-audit-agent',
      requestId: req.get('x-request-id'),
      userId: req.body.userId || 'api',
      channel: 'web',
    }));
  } catch (error) {
    return next(error);
  }
};

const runCraboxSuite = async (req, res, next) => {
  try {
    return res.status(202).json(await dataCore.craboxRunnerAdapter.runSuite(req.body, {
      agentId: 'dev-codex-github-agent',
      requestId: req.get('x-request-id'),
      userId: req.body.userId || 'api',
      channel: 'web',
    }));
  } catch (error) {
    return next(error);
  }
};

const dryRunLobsterWorkflow = async (req, res, next) => {
  try {
    return res.json(await dataCore.lobsterWorkflowShellAdapter.dryRunWorkflow(req.body, {
      agentId: 'daily-briefing-agent',
      requestId: req.get('x-request-id'),
      userId: req.body.userId || 'api',
      channel: 'web',
    }));
  } catch (error) {
    return next(error);
  }
};

const requestOrderStatusChange = async (req, res) =>
  res.status(202).json({
    status: 'dry_run',
    requiresApproval: true,
    orderId: req.params.id,
    proposedStatus: req.body.status,
    message: 'Order status changes are proposal-only in v0.1.',
  });

const requestManualPaymentMarkPaid = async (req, res) =>
  res.status(202).json({
    status: 'dry_run',
    requiresApproval: true,
    orderId: req.params.id,
    message: 'Manual payment mark-paid is proposal-only and requires approval.',
  });

const requestLeadStatusChange = async (req, res) =>
  res.status(202).json({
    status: 'dry_run',
    requiresApproval: true,
    leadId: req.params.id,
    proposedStatus: req.body.status,
    message: 'Lead status changes are proposal-only in v0.1.',
  });

const receiveGitHubWebhook = async (req, res, next) => {
  try {
    const result = await dataCore.githubWebhookHandler.handle({
      body: req.body,
      deliveryId: req.get('x-github-delivery'),
      event: req.get('x-github-event'),
      signature: req.get('x-hub-signature-256'),
    });
    return res.status(result.status === 'denied' ? 401 : 202).json(result);
  } catch (error) {
    return next(error);
  }
};

const getLead = async (req, res, next) => {
  try {
    const lead = await leadRepository.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: true, message: 'Lead not found' });
    }
    return res.json(lead);
  } catch (error) {
    return next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const lead = await leadRepository.updateLead(req.params.id, req.body);
    if (!lead) {
      return res.status(404).json({ error: true, message: 'Lead not found' });
    }
    return res.json(lead);
  } catch (error) {
    return next(error);
  }
};

const createLead = async (req, res, next) => {
  try {
    const lead = await leadRepository.createB2BLead({
      ...req.body,
      source: req.body.source || 'internal_api',
    });
    return res.status(201).json(lead);
  } catch (error) {
    return next(error);
  }
};

const updateLeadStatus = async (req, res, next) => {
  try {
    if (typeof req.body.status !== 'string' || !req.body.status.trim()) {
      return res.status(400).json({
        error: true,
        message: 'status is required.',
      });
    }
    const lead = await leadRepository.updateB2BLeadStatus(
      req.params.leadId,
      req.body.status.trim(),
    );
    if (!lead) {
      return res.status(404).json({ error: true, message: 'Lead not found' });
    }
    return res.json(lead);
  } catch (error) {
    return next(error);
  }
};

const addLeadNote = async (req, res, next) => {
  try {
    const lead = await leadRepository.addB2BLeadNote(
      req.params.leadId,
      req.body.note,
    );
    if (!lead) {
      return res.status(404).json({ error: true, message: 'Lead not found' });
    }
    return res.json(lead);
  } catch (error) {
    return next(error);
  }
};

const syncProducts = async (req, res, next) => {
  try {
    return res.json(await productRepository.syncMockProductsToSupabase());
  } catch (error) {
    return next(error);
  }
};

const listCustomers = async (req, res, next) => {
  try {
    return res.json(await customerRepository.listCustomers({
      limit: req.query.limit,
    }));
  } catch (error) {
    return next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    return res.status(201).json(
      await customerRepository.createCustomer(req.body),
    );
  } catch (error) {
    return next(error);
  }
};

const listInternalWorkerEvents = async (req, res, next) => {
  try {
    return res.json(await workerEventService.listWorkerEvents({
      limit: req.query.limit,
    }));
  } catch (error) {
    return next(error);
  }
};

const listConversations = async (req, res, next) => {
  try {
    return res.json(await conversationRepository.listConversations({
      limit: req.query.limit,
      status: req.query.status,
      worker: req.query.worker,
      intent: req.query.intent,
    }));
  } catch (error) {
    return next(error);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const conversation = await conversationRepository.getConversationById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: true, message: 'Conversation not found' });
    }
    return res.json(conversation);
  } catch (error) {
    return next(error);
  }
};

const listConversationMessages = async (req, res, next) => {
  try {
    const conversation = await conversationRepository.getConversationById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: true, message: 'Conversation not found' });
    }
    return res.json(
      await conversationRepository.getConversationMessages(
        req.params.id,
        req.query.limit,
      ),
    );
  } catch (error) {
    return next(error);
  }
};

const listWorkerRuns = async (req, res, next) => {
  try {
    return res.json(await aiWorkerRunRepository.listWorkerRuns({
      limit: req.query.limit,
      worker: req.query.worker,
      intent: req.query.intent,
    }));
  } catch (error) {
    return next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    return res.json(await operationsRepository.getDashboard());
  } catch (error) {
    return next(error);
  }
};

const listWorkers = async (req, res, next) => {
  try {
    return res.json(await operationsRepository.listWorkers());
  } catch (error) {
    return next(error);
  }
};

const updateWorker = async (req, res, next) => {
  try {
    const worker = await operationsRepository.updateWorker(req.params.id, req.body);
    if (!worker) {
      return res.status(404).json({ error: true, message: 'Worker not found' });
    }
    return res.json(worker);
  } catch (error) {
    return next(error);
  }
};

const listEvents = async (req, res, next) => {
  try {
    return res.json(await operationsRepository.listEvents(req.query.limit));
  } catch (error) {
    return next(error);
  }
};

const listHandoffs = async (req, res, next) => {
  try {
    return res.json(await operationsRepository.listHandoffs(req.query.status));
  } catch (error) {
    return next(error);
  }
};

const updateHandoff = async (req, res, next) => {
  try {
    const handoff = await operationsRepository.updateHandoff(req.params.id, req.body);
    if (!handoff) {
      return res.status(404).json({ error: true, message: 'Handoff not found' });
    }
    return res.json(handoff);
  } catch (error) {
    return next(error);
  }
};

const listIntegrations = async (req, res, next) => {
  try {
    return res.json(await operationsRepository.listIntegrations());
  } catch (error) {
    return next(error);
  }
};

const updateIntegration = async (req, res, next) => {
  try {
    const integration = await operationsRepository.updateIntegration(
      req.params.id,
      req.body,
    );
    if (!integration) {
      return res.status(404).json({ error: true, message: 'Integration not found' });
    }
    return res.json(integration);
  } catch (error) {
    return next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    return res.json(await operationsRepository.getSettings());
  } catch (error) {
    return next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    return res.json(await operationsRepository.updateSettings(req.body));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listOrders,
  getOrder,
  listOrdersRequiringAction,
  listManualPaymentOrders,
  listProducts,
  getProduct,
  listLeads,
  listLeadsFollowUp,
  getLead,
  listQuotes,
  getQuote,
  listQuotesFollowUp,
  listGitHubIssues,
  getGitHubIssue,
  listGitHubPullRequests,
  getGitHubPullRequest,
  listGitHubWorkflowRuns,
  getGitHubWorkflowRun,
  getGitHubRepository,
  createGitHubIssueDraft,
  createGitHubIssue,
  listAuditLogs,
  listApprovals,
  createApproval,
  approveApproval,
  rejectApproval,
  getDataHealth,
  listOpenClawEcosystemServices,
  listOpenClawSkills,
  reviewOpenClawSkill,
  approveOpenClawSkill,
  disableOpenClawSkill,
  runCraboxSuite,
  dryRunLobsterWorkflow,
  requestOrderStatusChange,
  requestManualPaymentMarkPaid,
  requestLeadStatusChange,
  receiveGitHubWebhook,
  createLead,
  updateLead,
  updateLeadStatus,
  addLeadNote,
  syncProducts,
  listCustomers,
  createCustomer,
  listInternalWorkerEvents,
  listConversations,
  getConversation,
  listConversationMessages,
  listWorkerRuns,
  getDashboard,
  listWorkers,
  updateWorker,
  listEvents,
  listHandoffs,
  updateHandoff,
  listIntegrations,
  updateIntegration,
  getSettings,
  updateSettings,
};
