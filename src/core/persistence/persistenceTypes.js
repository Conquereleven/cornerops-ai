const PERSISTENCE_PROVIDERS = Object.freeze({
  FILE_JSON: 'file_json',
  MEMORY: 'memory',
});

const createStoreError = (message, code, details = {}) => {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
};

module.exports = {
  PERSISTENCE_PROVIDERS,
  createStoreError,
};
