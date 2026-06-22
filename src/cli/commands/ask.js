const { operatorCommandRouter } = require('../../core/operator');

const ask = async (text, {
  channel = 'cli',
  metadata,
  operatorId = 'local-founder',
  requestId,
  sessionId,
} = {}) => operatorCommandRouter.handle({
  requestId,
  operatorId,
  channel,
  text,
  sessionId,
  metadata,
});

module.exports = { ask };
