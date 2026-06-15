const { generateWorkerReply } = require('../aiResponseService');

const handle = async ({ message, language = 'es', intent = 'support' }) => {
  const fallbackReply = language === 'en'
    ? 'I am the CornerOps support worker for Cornermex UAE. Tell me what you need and I will help or route the request to the right team.'
    : 'Soy el worker de soporte de CornerOps para Cornermex UAE. Cuéntame qué necesitas y te ayudaré o dirigiré la solicitud al equipo correcto.';

  const reply = await generateWorkerReply({
    worker: 'support worker',
    message,
    facts: { intent },
    instructions: 'Resolve general support questions. Ask a clarifying question for unknown requests.',
    fallbackReply,
  });
  return {
    reply,
    metadata: { requiresHuman: false, clarificationNeeded: intent === 'unknown' },
  };
};

module.exports = {
  handle,
};
