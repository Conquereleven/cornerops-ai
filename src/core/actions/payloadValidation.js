const { maskPiiInString, sanitizeMessage } = require('../security/SecuritySanitizer');
const { createActionError } = require('./actionTypes');

const SECRET_MARKERS = ['[REDACTED]', '[REDACTED_TELEGRAM_TOKEN]', '[REDACTED_JWT]'];
const ENTITY_TYPES = new Set(['lead', 'quote', 'order', 'github', 'general']);

const cleanText = (value, { field, max, required = false } = {}) => {
  const original = String(value || '').trim();
  if (required && !original) throw createActionError(`${field} is required.`, 'CONTROLLED_ACTION_PAYLOAD_INVALID');
  if (original.length > max) throw createActionError(`${field} exceeds ${max} characters.`, 'CONTROLLED_ACTION_PAYLOAD_TOO_LARGE');
  const sanitized = maskPiiInString(sanitizeMessage(original));
  if (SECRET_MARKERS.some((marker) => sanitized.includes(marker))) {
    throw createActionError(`${field} contains a secret or credential.`, 'CONTROLLED_ACTION_SECRET_DETECTED');
  }
  return sanitized;
};

const cleanRelatedEntity = (payload = {}) => {
  const relatedEntityType = payload.relatedEntityType || 'general';
  if (!ENTITY_TYPES.has(relatedEntityType)) {
    throw createActionError('relatedEntityType is invalid.', 'CONTROLLED_ACTION_PAYLOAD_INVALID');
  }
  return {
    relatedEntityType,
    relatedEntityId: payload.relatedEntityId
      ? cleanText(payload.relatedEntityId, { field: 'relatedEntityId', max: 160 })
      : undefined,
  };
};

const validateGitHubIssuePayload = (payload = {}, { allowedLabels = [] } = {}) => {
  const labels = [...new Set((Array.isArray(payload.labels) ? payload.labels : []).map((label) =>
    cleanText(label, { field: 'label', max: 50 })))]
    .filter(Boolean);
  if (allowedLabels.length && labels.some((label) => !allowedLabels.includes(label))) {
    throw createActionError('One or more GitHub labels are not allowlisted.', 'CONTROLLED_ACTION_LABEL_DENIED');
  }
  const assignees = [...new Set((Array.isArray(payload.assignees) ? payload.assignees : []).map((assignee) =>
    cleanText(assignee, { field: 'assignee', max: 39 })))]
    .filter(Boolean);
  return {
    title: cleanText(payload.title, { field: 'title', max: 256, required: true }),
    body: cleanText(payload.body, { field: 'body', max: 20000, required: true }),
    labels,
    assignees,
    sourceAgentId: payload.sourceAgentId
      ? cleanText(payload.sourceAgentId, { field: 'sourceAgentId', max: 100 })
      : undefined,
    sourceRequestId: payload.sourceRequestId
      ? cleanText(payload.sourceRequestId, { field: 'sourceRequestId', max: 160 })
      : undefined,
  };
};

const validateInternalNotePayload = (payload = {}) => ({
  title: cleanText(payload.title, { field: 'title', max: 256, required: true }),
  body: cleanText(payload.body, { field: 'body', max: 12000, required: true }),
  ...cleanRelatedEntity(payload),
  sourceAgentId: payload.sourceAgentId
    ? cleanText(payload.sourceAgentId, { field: 'sourceAgentId', max: 100 })
    : undefined,
});

const validateInternalTaskPayload = (payload = {}) => {
  const priority = payload.priority || 'medium';
  if (!['low', 'medium', 'high'].includes(priority)) {
    throw createActionError('priority is invalid.', 'CONTROLLED_ACTION_PAYLOAD_INVALID');
  }
  return {
    title: cleanText(payload.title, { field: 'title', max: 256, required: true }),
    description: cleanText(payload.description || '', { field: 'description', max: 12000 }),
    priority,
    ...cleanRelatedEntity(payload),
    sourceAgentId: payload.sourceAgentId
      ? cleanText(payload.sourceAgentId, { field: 'sourceAgentId', max: 100 })
      : undefined,
  };
};

module.exports = {
  cleanText,
  validateGitHubIssuePayload,
  validateInternalNotePayload,
  validateInternalTaskPayload,
};
