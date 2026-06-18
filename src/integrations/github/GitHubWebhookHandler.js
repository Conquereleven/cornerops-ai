class GitHubWebhookHandler {
  constructor({ auditLogService, client } = {}) {
    this.auditLogService = auditLogService;
    this.client = client;
    this.deliveryIds = new Set();
  }

  async handle({ body, deliveryId, event, signature }) {
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body || {});
    if (!this.client.verifyWebhookSignature({ body: rawBody, signature })) {
      await this.auditLogService?.record({
        eventType: 'security_denied',
        dataSource: 'github',
        operation: 'webhook',
        policyDecision: 'denied',
        status: 'denied',
        input: { event, deliveryId },
      });
      return { status: 'denied', reason: 'Invalid GitHub webhook signature.' };
    }
    if (this.deliveryIds.has(deliveryId)) {
      return { status: 'duplicate', deliveryId };
    }
    this.deliveryIds.add(deliveryId);
    await this.auditLogService?.record({
      eventType: 'data_read',
      dataSource: 'github',
      operation: `webhook.${event}`,
      policyDecision: 'allowed',
      status: 'success',
      input: { event, deliveryId },
    });
    return {
      status: 'accepted',
      deliveryId,
      event,
      normalized: {
        event,
        deliveryId,
        receivedAt: new Date().toISOString(),
      },
    };
  }

  clearForTests() {
    this.deliveryIds.clear();
  }
}

module.exports = {
  GitHubWebhookHandler,
};
