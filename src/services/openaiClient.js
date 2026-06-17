const OpenAI = require('openai');
const env = require('../config/env');
const logger = require('../utils/logger');

let client;

const getClient = () => {
  if (!client && env.openaiApiKey) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }

  return client;
};

const shouldUseMock = () =>
  env.nodeEnv === 'test' ||
  env.aiWorkersMode === 'mock' ||
  !env.openaiApiKey;

/**
 * Central OpenAI adapter. Keeping provider code here lets workers remain
 * independent and makes future tool calling, tracing, retries, and RAG easier.
 */
const askOpenAI = async (messages, options = {}) => {
  const { fallbackReply = 'CornerOps AI Worker activo en modo local.' } = options;

  if (shouldUseMock()) {
    return fallbackReply;
  }

  try {
    const response = await getClient().chat.completions.create({
      model: env.openaiModel,
      messages,
      temperature: 0.2,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content?.trim() || fallbackReply;
  } catch (error) {
    logger.warn('openai_fallback', {
      message: error.message,
      code: error.code,
    });
    return fallbackReply;
  }
};

module.exports = {
  askOpenAI,
};
