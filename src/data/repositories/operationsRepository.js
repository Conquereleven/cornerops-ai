const { randomUUID } = require('crypto');
const state = require('../mockOperations');
const conversationRepository = require('./conversationRepository');
const orderRepository = require('./orderRepository');
const productRepository = require('./productRepository');
const leadRepository = require('./leadRepository');
const aiWorkerRunRepository = require('./aiWorkerRunRepository');
const { getDataSourceStatus } = require('../supabase/supabaseClient');

const clone = (value) => JSON.parse(JSON.stringify(value));

const formatWaitSeconds = (createdAt) =>
  Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 1000));

const listWorkers = async () => clone(state.workers);

const getWorkerById = async (workerId) =>
  clone(state.workers.find((worker) => worker.id === workerId) || null);

const updateWorker = async (workerId, changes) => {
  const worker = state.workers.find((item) => item.id === workerId);
  if (!worker) return null;
  const allowed = ['enabled', 'model', 'prompt'];
  for (const key of allowed) {
    if (changes[key] !== undefined) worker[key] = changes[key];
  }
  worker.status = worker.enabled
    ? worker.id === 'ivrWorker' ? 'placeholder' : 'active'
    : 'inactive';
  state.metrics.activeWorkers = state.workers.filter(
    (item) => item.enabled && item.status === 'active',
  ).length;
  return clone(worker);
};

const listEvents = async (limit = 20) =>
  clone(state.events.slice(0, Math.max(1, Math.min(Number(limit) || 20, 100))));

const addEvent = async (event) => {
  const created = {
    id: `event-${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    tone: 'green',
    ...event,
  };
  state.events.unshift(created);
  state.events.splice(100);
  return clone(created);
};

const listHandoffs = async (status) =>
  clone(
    state.handoffs
      .filter((handoff) => !status || handoff.status === status)
      .map((handoff) => ({
        ...handoff,
        waitSeconds: formatWaitSeconds(handoff.createdAt),
      })),
  );

const createHandoff = async (data) => {
  const existing = state.handoffs.find(
    (item) =>
      item.conversationId === data.conversationId &&
      ['waiting', 'assigned'].includes(item.status),
  );
  if (existing) return clone(existing);
  const now = new Date().toISOString();
  const handoff = {
    id: `handoff-${randomUUID().slice(0, 8)}`,
    status: 'waiting',
    priority: 'medium',
    contact: '',
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  state.handoffs.unshift(handoff);
  state.metrics.humanHandoffs += 1;
  await addEvent({
    type: 'human_handoff',
    worker: 'humanHandoffWorker',
    message: `Nuevo handoff: ${handoff.reason}`,
    tone: 'amber',
  });
  return clone(handoff);
};

const updateHandoff = async (handoffId, changes) => {
  const handoff = state.handoffs.find((item) => item.id === handoffId);
  if (!handoff) return null;
  const allowed = ['status', 'priority', 'assignee', 'contact', 'notes'];
  for (const key of allowed) {
    if (changes[key] !== undefined) handoff[key] = changes[key];
  }
  handoff.updatedAt = new Date().toISOString();
  await addEvent({
    type: 'human_handoff',
    worker: 'humanHandoffWorker',
    message: `Handoff ${handoff.id} actualizado a ${handoff.status}`,
    tone: handoff.status === 'resolved' ? 'green' : 'amber',
  });
  return clone({ ...handoff, waitSeconds: formatWaitSeconds(handoff.createdAt) });
};

const listIntegrations = async () => {
  const integrations = clone(state.integrations);
  const supabaseIntegration = integrations.find((item) => item.id === 'supabase');
  if (supabaseIntegration && getDataSourceStatus().mode === 'supabase') {
    supabaseIntegration.status = 'connected';
  }
  return integrations;
};

const updateIntegration = async (integrationId, changes) => {
  const integration = state.integrations.find((item) => item.id === integrationId);
  if (!integration) return null;
  if (changes.status !== undefined) integration.status = changes.status;
  return clone(integration);
};

const getSettings = async () => clone(state.settings);

const updateSettings = async (changes) => {
  const allowed = [
    'productName',
    'businessName',
    'region',
    'languages',
    'futureLanguages',
    'developmentMode',
    'operatorName',
  ];
  for (const key of allowed) {
    if (changes[key] !== undefined) state.settings[key] = changes[key];
  }
  return clone(state.settings);
};

const recordWorkerRun = async ({
  worker,
  intent,
  latencyMs,
  conversationCreated,
  metadata = {},
}) => {
  const workerState = state.workers.find((item) => item.id === worker);
  if (workerState) {
    workerState.interactions += 1;
    workerState.latencyMs = Math.max(1, Math.round(latencyMs));
    workerState.lastActivity = new Date().toISOString();
  }
  if (conversationCreated) state.metrics.conversationsToday += 1;
  if (intent === 'order_status') state.metrics.ordersConsulted += 1;
  if (intent === 'product_search') state.metrics.productsConsulted += 1;
  if (intent === 'b2b_lead' && metadata.leadCaptured) {
    state.metrics.b2bLeadsCaptured += 1;
  }
  const eventMessages = {
    order_status: `Orden #${metadata.orderId || 'sin número'} consultada`,
    product_search: `Consulta de producto atendida por ${worker}`,
    b2b_lead: 'Oportunidad B2B procesada',
    human_handoff: 'Solicitud escalada al equipo humano',
    support: 'Consulta general atendida',
  };
  return addEvent({
    type: intent,
    worker,
    message: eventMessages[intent] || `${worker} completó una ejecución`,
    tone: intent === 'human_handoff' ? 'amber' : intent === 'order_status' ? 'blue' : 'green',
  });
};

const getDashboard = async () => {
  const [conversations, orders, products, leads, runs, handoffs, workers] =
    await Promise.all([
      conversationRepository.listConversations({ limit: 1000 }),
      orderRepository.listOrders({ limit: 1000 }),
      productRepository.listProducts({ limit: 1000 }),
      leadRepository.listLeads({ limit: 1000 }),
      aiWorkerRunRepository.listWorkerRuns({ limit: 1000 }),
      listHandoffs('waiting'),
      listWorkers(),
    ]);

  const runCounts = runs.reduce((counts, run) => {
    counts[run.worker] = (counts[run.worker] || 0) + 1;
    return counts;
  }, {});
  const dashboardWorkers = workers.map((worker) => {
    const latestRun = runs.find((run) => run.worker === worker.id);
    return {
      ...worker,
      interactions: worker.interactions + (runCounts[worker.id] || 0),
      ...(latestRun && {
        latencyMs: latestRun.latencyMs || worker.latencyMs,
        lastActivity: latestRun.createdAt,
      }),
    };
  });
  const runEvents = runs.slice(0, 8).map((run) => ({
    id: run.id,
    type: run.intent || 'worker_run',
    worker: run.worker,
    message: run.success
      ? `${run.worker} ejecutó ${run.intent || 'una tarea'}`
      : `${run.worker} falló: ${run.errorMessage || 'error desconocido'}`,
    tone: run.success
      ? run.intent === 'order_status' ? 'blue' : 'green'
      : 'amber',
    createdAt: run.createdAt,
  }));
  const humanHandoffKeys = new Set([
    ...conversations
      .filter(
        (conversation) =>
          conversation.requiresHuman || conversation.status === 'needs_human',
      )
      .map((conversation) => conversation.id),
    ...handoffs.map((handoff) => handoff.conversationId || handoff.id),
  ]);

  return {
    metrics: {
      totalConversations: conversations.length,
      totalLeads: leads.length,
      totalOrders: orders.length,
      activeProducts: products.filter((product) => product.active !== false).length,
      humanHandoffs: humanHandoffKeys.size,
      workerRuns: runs.length,
      conversationsToday: conversations.length,
      b2bLeadsCaptured: leads.length,
      ordersConsulted: orders.length,
      productsConsulted: products.length,
      activeWorkers: dashboardWorkers.filter(
        (worker) => worker.status === 'active',
      ).length,
      totalWorkers: dashboardWorkers.length,
      firstResponseSeconds: state.metrics.firstResponseSeconds,
    },
    workers: dashboardWorkers,
    events: runEvents.length ? runEvents : await listEvents(8),
    handoffs,
    dataSource: getDataSourceStatus(),
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  listWorkers,
  getWorkerById,
  updateWorker,
  listEvents,
  addEvent,
  listHandoffs,
  createHandoff,
  updateHandoff,
  listIntegrations,
  updateIntegration,
  getSettings,
  updateSettings,
  recordWorkerRun,
  getDashboard,
};
