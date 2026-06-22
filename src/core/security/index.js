const { FileRateLimitStore } = require('./FileRateLimitStore');
const { FileRejectionStore } = require('./FileRejectionStore');
const { FileReplayStore } = require('./FileReplayStore');
const { OperatorRateLimitService } = require('./OperatorRateLimitService');
const { RateLimitStore } = require('./RateLimitStore');
const { RejectionStore } = require('./RejectionStore');
const { RejectionTrackingService } = require('./RejectionTrackingService');
const { ReplayProtectionService } = require('./ReplayProtectionService');
const { ReplayStore } = require('./ReplayStore');

const createOperatorSecurityServices = ({ auditLogService, config } = {}) => {
  const replayFileMode = ['file', 'file_json'].includes(config.corneropsReplayStoreProvider);
  const rejectionFileMode = ['file', 'file_json'].includes(config.corneropsRejectionStoreProvider);
  const rateLimitFileMode = ['file', 'file_json'].includes(config.corneropsRateLimitStoreProvider);
  const replayStore = replayFileMode
    ? new FileReplayStore({ filePath: config.corneropsReplayStorePath })
    : new ReplayStore();
  const rejectionStore = rejectionFileMode
    ? new FileRejectionStore({ filePath: config.corneropsRejectionStorePath })
    : new RejectionStore();
  const rateLimitStore = rateLimitFileMode
    ? new FileRateLimitStore({ filePath: config.corneropsRateLimitStorePath })
    : new RateLimitStore();
  const replayProtectionService = new ReplayProtectionService({
    auditLogService,
    enabled: config.corneropsReplayProtectionEnabled,
    failClosed: config.corneropsReplayFailClosed,
    store: replayStore,
    ttlSeconds: config.corneropsReplayTtlSeconds,
  });
  const rejectionTrackingService = new RejectionTrackingService({
    enabled: config.corneropsRejectionStoreEnabled,
    retentionDays: config.corneropsRejectionRetentionDays,
    store: rejectionStore,
  });
  const operatorRateLimitService = new OperatorRateLimitService({
    auditLogService,
    burst: config.corneropsOperatorRateLimitBurst,
    enabled: config.corneropsRateLimitingEnabled,
    failClosed: config.corneropsTelegramFailClosed,
    limitPerMinute: config.corneropsOperatorRateLimitPerMinute,
    store: rateLimitStore,
  });
  return {
    operatorRateLimitService,
    rejectionStore,
    rejectionTrackingService,
    replayProtectionService,
    replayStore,
    rateLimitStore,
  };
};

module.exports = {
  createOperatorSecurityServices,
  FileRateLimitStore,
  FileRejectionStore,
  FileReplayStore,
  OperatorRateLimitService,
  RateLimitStore,
  RejectionStore,
  RejectionTrackingService,
  ReplayProtectionService,
  ReplayStore,
};
