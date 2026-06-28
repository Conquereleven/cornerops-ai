class MessageDraftPolicy {
  constructor({ piiMasking = true, readOnly = true, dryRun = true } = {}) {
    this.config = { piiMasking, readOnly, dryRun };
  }

  evaluate() {
    const warnings = [];
    if (!this.config.readOnly) warnings.push('MESSAGE_DRAFT_READ_ONLY_REQUIRED');
    if (!this.config.dryRun) warnings.push('MESSAGE_DRAFT_DRY_RUN_REQUIRED');
    if (!this.config.piiMasking) warnings.push('MESSAGE_DRAFT_PII_MASKING_DISABLED');
    return {
      allowed: warnings.length === 0,
      dryRun: true,
      sendAllowed: false,
      sendStatus: 'not_sendable_in_v1.2',
      warnings,
    };
  }
}

module.exports = { MessageDraftPolicy };
