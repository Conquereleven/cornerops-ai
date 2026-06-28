#!/usr/bin/env node
const data = require('../src/core/data');
const { CornerMexMessageDraftService } = require('../src/core/drafts');

const main = async () => {
  const service = new CornerMexMessageDraftService({ auditLogService: data.auditLogService });
  const whatsapp = await service.createDraft({
    channel: 'whatsapp',
    text: 'quote #123 follow-up for Tajin and Pulparindo',
    requestId: 'demo-whatsapp-draft-v1.2',
  });
  const email = await service.createDraft({
    channel: 'email',
    text: 'B2B lead #456 intro follow-up',
    requestId: 'demo-email-draft-v1.2',
  });
  process.stdout.write(`${JSON.stringify({
    demo: 'message_drafts_v1.2',
    drafts: [whatsapp, email].map((result) => ({
      status: result.status,
      type: result.draft?.type,
      channel: result.draft?.channel,
      sendStatus: result.draft?.sendStatus,
      localOnly: result.draft?.localOnly,
      auditId: result.auditId,
    })),
    externalSends: 'blocked',
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Message drafts demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
