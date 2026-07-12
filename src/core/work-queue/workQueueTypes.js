const WORK_ITEM_STATUSES = Object.freeze([
  'recommended', 'drafted', 'queued_for_approval', 'approved', 'rejected',
  'in_progress', 'manually_completed', 'dismissed', 'expired',
]);
const WORK_ITEM_PRIORITIES = Object.freeze(['critical', 'high', 'medium', 'low']);
const APPROVAL_STATUSES = Object.freeze(['pending', 'approved', 'rejected', 'cancelled', 'expired']);
const INTERNAL_TABLES = Object.freeze(['work_items', 'approval_requests', 'audit_events']);
const OPEN_WORK_ITEM_STATUSES = Object.freeze([
  'recommended', 'drafted', 'queued_for_approval', 'approved', 'in_progress',
]);

const createWorkQueueError = (message, code, statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  APPROVAL_STATUSES,
  INTERNAL_TABLES,
  OPEN_WORK_ITEM_STATUSES,
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_STATUSES,
  createWorkQueueError,
};
