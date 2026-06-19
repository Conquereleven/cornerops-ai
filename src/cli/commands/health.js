const { ask } = require('./ask');

const health = (options) => ask('Show data health and data sources', options);

module.exports = { health };
