const { randomUUID, createHash } = require('crypto');

const checksum = (value) => createHash('sha256').update(String(value || '')).digest('hex').slice(0, 16);

class ContextNormalizer {
  normalizeRecord(input = {}) {
    const now = new Date().toISOString();
    const text = String(input.text || input.normalizedMarkdown || '').trim();
    return {
      id: input.id || `ctx-${randomUUID().slice(0, 12)}`,
      sourceId: input.sourceId || 'manual_uploads',
      sourceType: input.sourceType || 'unknown',
      externalId: input.externalId,
      title: input.title,
      text,
      normalizedMarkdown: input.normalizedMarkdown,
      author: input.author,
      participants: input.participants || [],
      channelName: input.channelName,
      threadId: input.threadId,
      url: input.url,
      tags: input.tags || [],
      entities: input.entities || [],
      relatedLeadId: input.relatedLeadId,
      relatedQuoteId: input.relatedQuoteId,
      relatedOrderId: input.relatedOrderId,
      relatedGitHubIssue: input.relatedGitHubIssue,
      piiLevel: input.piiLevel || 'medium',
      provenance: {
        adapter: input.provenance?.adapter || input.adapter || 'mock',
        originalSource: input.provenance?.originalSource || input.originalSource || 'mock',
        importedAt: input.provenance?.importedAt || now,
        sourceCreatedAt: input.provenance?.sourceCreatedAt,
        sourceUpdatedAt: input.provenance?.sourceUpdatedAt,
        checksum: input.provenance?.checksum || checksum(text),
      },
      createdAt: input.createdAt || now,
      updatedAt: input.updatedAt || now,
    };
  }
}

module.exports = {
  ContextNormalizer,
};
