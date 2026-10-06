const env = require('../../config/env');
const { getSharedInternalStore } = require('../work-queue/sharedInternalStore');
const { SupabaseIdentityVerifier } = require('./SupabaseIdentityVerifier');
const { PostgresWorkspaceStore, UnavailableWorkspaceStore } = require('./workspaceStores');

let overrides = {};
let defaults;

const buildDefaults = () => {
  const internalStore = getSharedInternalStore();
  return {
    verifier: new SupabaseIdentityVerifier({
      url: env.corneropsAuthSupabaseUrl,
      publishableKey: env.corneropsAuthSupabasePublishableKey,
    }),
    workspaceStore: internalStore.pool
      ? new PostgresWorkspaceStore({ internalStore })
      : new UnavailableWorkspaceStore(),
    auditStore: internalStore,
  };
};

const current = () => {
  if (!defaults) defaults = buildDefaults();
  return { ...defaults, ...overrides };
};

// The single injection point for the application boundary. Tests replace the
// verifier and stores here; there is no environment-based bypass.
module.exports = {
  configure(next = {}) { overrides = { ...overrides, ...next }; },
  reset() { overrides = {}; },
  get verifier() { return current().verifier; },
  get workspaceStore() { return current().workspaceStore; },
  get auditStore() { return current().auditStore; },
};
