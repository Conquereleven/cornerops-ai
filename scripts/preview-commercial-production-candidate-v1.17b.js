const fs = require('fs');
const path = require('path');
const { CommercialProductionCandidateService } = require('../src/core/commercial/CommercialProductionCandidateService');

const candidatePath = path.resolve(
  __dirname,
  '../docs/commercial/input-packs/commercial-production-candidate-v1.17b.json',
);
const candidate = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
const result = new CommercialProductionCandidateService().validate(candidate);

console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;
