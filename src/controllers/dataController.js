const orderRepository = require('../data/repositories/orderRepository');
const productRepository = require('../data/repositories/productRepository');
const leadRepository = require('../data/repositories/leadRepository');
const conversationRepository = require('../data/repositories/conversationRepository');
const operationsRepository = require('../data/repositories/operationsRepository');
const aiWorkerRunRepository = require('../data/repositories/aiWorkerRunRepository');
const customerRepository = require('../data/repositories/customerRepository');
const workerEventService = require('../services/workerEventService');

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
  listProducts,
  getProduct,
  listLeads,
  getLead,
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
