#!/usr/bin/env node
const data = require('../src/core/data');
const { CornerMexFlowEngine } = require('../src/core/flows/cornermex');
const { FounderReviewService, IntelligenceService } = require('../src/core/intelligence');

const createService = () => {
  const flowEngine = new CornerMexFlowEngine({
    auditLogService: data.auditLogService,
    connector: data.lovableCornerMexConnector,
  });
  const intelligenceService = new IntelligenceService({
    auditLogService: data.auditLogService,
    connector: data.lovableCornerMexConnector,
    flowEngine,
  });
  return new FounderReviewService({
    auditLogService: data.auditLogService,
    intelligenceService,
  });
};

const summarize = (review) => ({
  status: review.status,
  generatedAt: review.generatedAt,
  sourceMode: review.sourceMode,
  dataSource: review.dataSource,
  safetyPosture: review.safetyPosture,
  dataQuality: review.dataQuality,
  executiveSummary: review.executiveSummary,
  urgentActions: review.urgentActions,
  operationalMetrics: review.operationalMetrics,
  anomalyCandidateCount: review.anomalyCandidates.length,
  caseDraftCount: review.caseDrafts.length,
  recommendedActions: review.recommendedActions,
  missingData: review.missingData,
  nextFounderStep: review.nextFounderStep,
  auditId: review.auditId,
  warnings: review.warnings,
});

const main = async () => {
  const review = await createService().buildFounderReview({
    requestId: `founder-review-cli-${Date.now()}`,
    userId: 'local-founder',
    channel: 'cli',
  });
  process.stdout.write(`${JSON.stringify(summarize(review), null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Founder review failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { createService, main, summarize };
