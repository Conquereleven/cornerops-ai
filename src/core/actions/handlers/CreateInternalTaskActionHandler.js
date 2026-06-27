class CreateInternalTaskActionHandler {
  constructor({ service } = {}) {
    this.service = service;
  }

  createDraft(payload) {
    return this.service.createDraft(payload);
  }

  async execute(payload, { actor, auditId, dryRun } = {}) {
    const draft = this.createDraft(payload);
    if (dryRun) return { status: 'dry_run_executed', dryRun: true, payload: draft.payload };
    const resource = this.service.create(draft.payload, { actor, auditId });
    return { status: 'executed', dryRun: false, resource };
  }
}

module.exports = { CreateInternalTaskActionHandler };
