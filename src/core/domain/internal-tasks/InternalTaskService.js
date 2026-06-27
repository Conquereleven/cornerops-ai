const { randomUUID } = require('crypto');
const { validateInternalTaskPayload } = require('../../actions/payloadValidation');

class InternalTaskService {
  constructor({ repository } = {}) {
    this.repository = repository;
  }

  createDraft(payload) {
    return { status: 'draft', dryRun: true, payload: validateInternalTaskPayload(payload) };
  }

  create(payload, { actor, auditId } = {}) {
    const clean = validateInternalTaskPayload(payload);
    return this.repository.create({
      id: `task-${randomUUID().slice(0, 12)}`,
      ...clean,
      createdBy: actor,
      status: 'open',
      sourceMode: 'local_internal',
      createdAt: new Date().toISOString(),
      auditId,
    });
  }

  list(options) {
    return this.repository.list(options);
  }
}

module.exports = { InternalTaskService };
