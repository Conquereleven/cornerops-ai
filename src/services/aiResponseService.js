const cornermexSystemPrompt = require('../prompts/cornermexSystemPrompt');
const { askOpenAI } = require('./openaiClient');

const SAFE_SYSTEM_PROMPT =
  'Eres un AI Worker interno de Cornermex UAE. Ayudas con soporte, ventas, órdenes y leads B2B. Responde breve, profesional y útil. No inventes datos. Si falta información, pide lo mínimo necesario. Si hay datos estructurados del sistema, úsalos como fuente de verdad.';

const limitText = (value, maximum) => String(value || '').slice(0, maximum);

const generateWorkerReply = async ({
  worker,
  message,
  facts = {},
  instructions = '',
  fallbackReply,
}) => {
  const safeFacts = limitText(JSON.stringify(facts), 6000);
  return askOpenAI(
    [
      { role: 'system', content: cornermexSystemPrompt },
      {
        role: 'system',
        content: [
          SAFE_SYSTEM_PROMPT,
          `You are the ${worker} for Cornermex UAE.`,
          'The repository facts below are authoritative.',
          'Never add an order, price, stock level, delivery date, or product that is not present in these facts.',
          'If required data is missing, ask for it. For B2B, guide the customer toward a quotation.',
          instructions,
          `VERIFIED_FACTS=${safeFacts}`,
        ].filter(Boolean).join('\n'),
      },
      { role: 'user', content: limitText(message, 2000) },
    ],
    { fallbackReply },
  );
};

module.exports = { generateWorkerReply, SAFE_SYSTEM_PROMPT };
