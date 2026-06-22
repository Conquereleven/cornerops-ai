const { ask } = require('./ask');

const audit = (filter, options) => {
  if (filter === 'denied') return ask('Show denied audit actions', options);
  if (filter === 'errors') return ask('Show audit errors', options);
  return ask('Show audit summary and last 20 audit events', options);
};

module.exports = { audit };
