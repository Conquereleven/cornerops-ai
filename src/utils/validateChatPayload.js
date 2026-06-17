const { MAX_INPUT_LENGTH } = require('./sanitizeInput');

const validateChatPayload = (payload = {}) => {
  const errors = [];
  if (typeof payload.userId !== 'string' || !payload.userId.trim()) {
    errors.push('userId es obligatorio y debe ser texto.');
  }
  if (typeof payload.message !== 'string' || !payload.message.trim()) {
    errors.push('message es obligatorio y debe ser texto.');
  } else if (payload.message.length > MAX_INPUT_LENGTH) {
    errors.push(`message no puede exceder ${MAX_INPUT_LENGTH} caracteres.`);
  }
  if (
    payload.conversationId !== undefined &&
    (typeof payload.conversationId !== 'string' ||
      !payload.conversationId.trim())
  ) {
    errors.push('conversationId debe ser texto cuando se proporciona.');
  }
  if (
    payload.requestId !== undefined &&
    (typeof payload.requestId !== 'string' ||
      !payload.requestId.trim() ||
      payload.requestId.length > 128)
  ) {
    errors.push('requestId debe ser texto de máximo 128 caracteres.');
  }
  return errors;
};

module.exports = { validateChatPayload };
