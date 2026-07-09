const engine = require('./IntelligenceEngine');
const { IntelligenceService } = require('./IntelligenceService');
const types = require('./intelligenceTypes');

module.exports = {
  IntelligenceService,
  ...engine,
  ...types,
};
