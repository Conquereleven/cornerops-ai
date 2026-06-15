const MAX_INPUT_LENGTH = 2000;

const sanitizeInput = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, MAX_INPUT_LENGTH);
};

module.exports = {
  MAX_INPUT_LENGTH,
  sanitizeInput,
};
