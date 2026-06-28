#!/usr/bin/env node
const { TelegramFounderIdHelpService } = require('../src/integrations/telegram/TelegramFounderIdHelpService');

const sampleUpdate = {
  update_id: 12100,
  message: {
    message_id: 12100,
    chat: { id: 7001, type: 'private' },
    from: { id: 7001, username: 'founder' },
    text: 'redacted local setup ping',
  },
};

const main = () => {
  const service = new TelegramFounderIdHelpService();
  const candidate = service.extractCandidate(sampleUpdate);
  process.stdout.write(`${JSON.stringify({
    check: 'telegram_founder_id_help_v1.2.1',
    candidate,
    instructions: service.instructions(),
    safety: {
      fullMessageTextStored: false,
      autoAllowlisted: false,
      repliesSent: false,
      groupsAccepted: false,
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main();
}

module.exports = { main };
