const { detectIntent } = require('../utils/detectIntent');
const { sanitizeInput } = require('../utils/sanitizeInput');
const supportWorker = require('./workers/supportWorker');
const salesWorker = require('./workers/salesWorker');
const ordersWorker = require('./workers/ordersWorker');
const b2bWorker = require('./workers/b2bWorker');
const humanHandoffWorker = require('./workers/humanHandoffWorker');
const conversationRepository = require('../data/repositories/conversationRepository');
const aiWorkerRunRepository = require('../data/repositories/aiWorkerRunRepository');
const operationsRepository = require('../data/repositories/operationsRepository');
const { detectLanguage } = require('../utils/language');
const {
  buildMemoryFromMessages,
  extractMemoryData,
  mergeMemory,
} = require('./memoryService');

const workers = Object.freeze({
  supportWorker,
  salesWorker,
  ordersWorker,
  b2bWorker,
  humanHandoffWorker,
});

const handleMessage = async (userId, message, conversationId) => {
  const startedAt = Date.now();
  const cleanUserId = sanitizeInput(userId);
  const cleanMessage = sanitizeInput(message);

  if (!cleanUserId || !cleanMessage) {
    const error = new Error('userId y message son obligatorios.');
    error.statusCode = 400;
    throw error;
  }

  let conversation = conversationId
    ? await conversationRepository.getConversationById(conversationId)
    : null;
  const conversationCreated = !conversation;
  if (!conversation) {
    conversation = await conversationRepository.createConversation(cleanUserId);
  }
  const history = await conversationRepository.getConversationMessages(
    conversation.id,
    12,
  );
  const previousMemory = buildMemoryFromMessages(history);
  const routing = detectIntent(cleanMessage, previousMemory);
  const worker = workers[routing.worker] || workers.supportWorker;
  const selectedWorkerName = workers[routing.worker]
    ? routing.worker
    : 'supportWorker';
  const memorySummary = mergeMemory(previousMemory, {
    ...extractMemoryData(cleanMessage),
    lastWorker: selectedWorkerName,
    lastIntent: routing.intent,
    intentCategory: routing.category,
  });

  await conversationRepository.addMessage({
    conversationId: conversation.id,
    userId: cleanUserId,
    role: 'user',
    content: cleanMessage,
    intent: routing.intent,
    worker: selectedWorkerName,
    metadata: { memorySummary },
  });
  let workerResult;
  try {
    workerResult = await worker.handle({
      userId: cleanUserId,
      message: cleanMessage,
      intent: routing.intent,
      history: [...history, {
        role: 'user',
        content: cleanMessage,
        metadata: { memorySummary },
      }],
      memory: memorySummary,
      language: detectLanguage(cleanMessage),
    });
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    await aiWorkerRunRepository.createWorkerRun({
      conversationId: conversation.id,
      userId: cleanUserId,
      worker: selectedWorkerName,
      intent: routing.intent,
      input: cleanMessage,
      output: '',
      metadata: {},
      success: false,
      errorMessage: error.message,
      latencyMs,
    });
    await conversationRepository.updateConversation(conversation.id, {
      lastMessage: cleanMessage,
      mainWorker: selectedWorkerName,
      mainIntent: routing.intent,
      requiresHuman: false,
    });
    throw error;
  }
  const normalizedResult =
    typeof workerResult === 'string'
      ? { reply: workerResult, metadata: {} }
      : workerResult;
  const finalMemorySummary = mergeMemory(
    memorySummary,
    normalizedResult.metadata?.memoryData || {},
  );
  await conversationRepository.addMessage({
    conversationId: conversation.id,
    userId: cleanUserId,
    role: 'assistant',
    content: normalizedResult.reply,
    intent: routing.intent,
    worker: selectedWorkerName,
    metadata: {
      ...(normalizedResult.metadata || {}),
      memorySummary: finalMemorySummary,
    },
  });
  const latencyMs = Date.now() - startedAt;
  await aiWorkerRunRepository.createWorkerRun({
    conversationId: conversation.id,
    userId: cleanUserId,
    worker: selectedWorkerName,
    intent: routing.intent,
    input: cleanMessage,
    output: normalizedResult.reply,
    metadata: normalizedResult.metadata,
    success: true,
    latencyMs,
  });
  await conversationRepository.updateConversation(conversation.id, {
    status: normalizedResult.metadata?.requiresHuman ? 'needs_human' : 'active',
    lastMessage: normalizedResult.reply,
    mainWorker: selectedWorkerName,
    mainIntent: routing.intent,
    requiresHuman: Boolean(normalizedResult.metadata?.requiresHuman),
  });
  await operationsRepository.recordWorkerRun({
    worker: selectedWorkerName,
    intent: routing.intent,
    latencyMs,
    conversationCreated,
    metadata: normalizedResult.metadata,
  });
  if (normalizedResult.metadata?.requiresHuman) {
    await operationsRepository.createHandoff({
      conversationId: conversation.id,
      userId: cleanUserId,
      reason: cleanMessage.slice(0, 120),
      priority: 'medium',
    });
  }

  return {
    reply: normalizedResult.reply,
    worker: selectedWorkerName,
    intent: routing.intent,
    conversationId: conversation.id,
    metadata: {
      ...(normalizedResult.metadata || {}),
      latencyMs,
    },
    intentCategory: routing.category,
    memorySummary: finalMemorySummary,
  };
};

module.exports = {
  handleMessage,
};
