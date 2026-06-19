const { ask } = require('./ask');

const help = (options) => ask('help', options);

module.exports = { help };
