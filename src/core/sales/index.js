const { getSharedInternalStore } = require('../work-queue/sharedInternalStore');
const { SalesService } = require('./SalesService');
const { MemorySalesStore, PostgresSalesStore, UnavailableSalesStore } = require('./salesStores');

let service;
const getSalesService = () => {
  if (!service) {
    const internalStore = getSharedInternalStore();
    service = new SalesService({ store: internalStore.pool ? new PostgresSalesStore({ internalStore }) : new UnavailableSalesStore() });
  }
  return service;
};

module.exports = {
  ...require('./salesSchema'),
  ...require('./csvPreview'),
  MemorySalesStore, PostgresSalesStore, SalesService, UnavailableSalesStore,
  getSalesService,
  // Tests swap the store through the same seam production uses.
  setSalesService(next) { service = next; },
};
