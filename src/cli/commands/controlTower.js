const { ask } = require('./ask');

const controlTower = (options) => ask('Show system health and Control Tower status', options);

module.exports = { controlTower };
