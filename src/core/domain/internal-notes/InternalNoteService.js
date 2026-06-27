const { randomUUID } = require('crypto');
const { validateInternalNotePayload } = require('../../actions/payloadValidation');

class InternalNoteService {
  constructor({ repository } = {}) {
    this.repository = repository;
  }

  createDraft(payload) {
    return { status: 'draft', dryRun: true, payload: validateInternalNotePayload(payload) };
  }

  create(payload, { actor, auditId } = {}) {
    const clean = validateInternalNotePayload(payload);
    return this.repository.create({
      id: `note-${randomUUID().slice(0, 12)}`,
      ...clean,
      createdBy: actor,
      sourceMode: 'local_internal',
      createdAt: new Date().toISOString(),
      auditId,
    });
  }

  list(options) {
    return this.repository.list(options);
  }
}

module.exports = { InternalNoteService };
