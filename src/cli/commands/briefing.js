const { ask } = require('./ask');

const briefing = (options) => ask("Give me today's briefing", options);

module.exports = { briefing };
