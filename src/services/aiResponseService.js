const cornermexSystemPrompt = require('../prompts/cornermexSystemPrompt');
const { askOpenAI } = require('./openaiClient');

const generateWorkerReply = async ({
  worker,
  message,
  facts = {},
  instructions = '',
  fallbackReply,
}) =>
  askOpenAI(
    [
      { role: 'system', content: cornermexSystemPrompt },
      {
        role: 'system',
        content: [
          `You are the ${worker} for Cornermex UAE.`,
          'The repository facts below are authoritative.',
          'Never add an order, price, stock level, delivery date, or product that is not present in these facts.',
          'If required data is missing, ask for it. For B2B, guide the customer toward a quotation.',
          instructions,
          `VERIFIED_FACTS=${JSON.stringify(facts)}`,
        ].filter(Boolean).join('\n'),
      },
      { role: 'user', content: message },
    ],
    { fallbackReply },
  );

module.exports = { generateWorkerReply };
