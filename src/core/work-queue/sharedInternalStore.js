const env = require('../../config/env');
const { createInternalOperationsStore } = require('./InternalOperationsStoreFactory');

let store;

// One pool for every consumer of the private CornerOps schema.
const getSharedInternalStore = () => {
  if (!store) store = createInternalOperationsStore(env);
  return store;
};

module.exports = { getSharedInternalStore };
