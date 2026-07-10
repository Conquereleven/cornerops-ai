const SUPPORTED_STAGES = Object.freeze([
  'setup',
  'pre_launch',
  'soft_launch',
  'live',
  'growth',
  'scale',
  'paused',
  'incident_mode',
]);

const WORKFLOW_RULES = Object.freeze({
  product_quality_flow: {
    stages: ['setup', 'pre_launch', 'soft_launch', 'live', 'growth', 'scale'],
    requiredData: ['products'],
    preLaunchReason: 'Catalog quality is active in pre-launch because products exist.',
    unlock: 'Readable product catalog exists.',
  },
  b2b_lead_flow: {
    stages: ['pre_launch', 'soft_launch', 'live', 'growth', 'scale'],
    requiredData: ['leads'],
    preLaunchReason: 'B2B lead review is active when lead records exist.',
    unlock: 'Add readable B2B lead records.',
  },
  quote_follow_up_flow: {
    stages: ['pre_launch', 'soft_launch', 'live', 'growth', 'scale'],
    requiredData: ['quotes'],
    preLaunchReason: 'Quote follow-up is active when quote records exist; send paths require approval.',
    unlock: 'Add readable quote records.',
  },
  manual_payment_review_flow: {
    stages: ['pre_launch', 'soft_launch', 'live', 'growth', 'scale'],
    requiredData: ['payments', 'orders'],
    preLaunchReason: 'Manual payment review can prepare internal tasks before launch.',
    unlock: 'Expose readable payment or order payment records.',
  },
  order_attention_flow: {
    stages: ['soft_launch', 'live', 'growth', 'scale'],
    requiredData: ['orders'],
    preLaunchReason: 'Not active for current operating stage; unlocks when real orders require attention.',
    unlock: 'Enter soft_launch and receive real order records requiring attention.',
  },
  fulfillment_review_flow: {
    stages: ['soft_launch', 'live', 'growth', 'scale'],
    requiredData: ['fulfillment', 'orders'],
    preLaunchReason: 'Not active for current operating stage; waits for fulfillment/shipment records.',
    unlock: 'Enter soft_launch and expose fulfillment or shipment records.',
  },
  customer_follow_up_flow: {
    stages: ['live', 'growth', 'scale'],
    requiredData: ['customers', 'consent'],
    preLaunchReason: 'Pre-launch customer follow-up is disabled until customer history and consent exist.',
    unlock: 'Reach live/growth stage with repeat customer history and consent evidence.',
  },
});

class OperatingStageEngine {
  constructor({ config = {} } = {}) {
    this.config = config;
  }

  getCurrentStage() {
    const raw = this.config.operatingStage || this.config.cornerMexOperatingStage || 'pre_launch';
    return SUPPORTED_STAGES.includes(raw) ? raw : 'pre_launch';
  }

  build({ actionEngine = {}, catalog = {}, founderReview = {} } = {}) {
    const operatingStage = this.getCurrentStage();
    const flowsById = Object.fromEntries((actionEngine.flows || []).map((flow) => [flow.id, flow]));
    const stageWorkflows = Object.entries(WORKFLOW_RULES).map(([id, rule]) => {
      const flow = flowsById[id] || {};
      const stageAvailability = rule.stages.includes(operatingStage) ? 'available_in_stage' : 'not_active_for_stage';
      const hasData = flow.dataState === 'has_data' || Boolean(flow.counts?.candidates);
      const shouldBeActiveNow = stageAvailability === 'available_in_stage' && (hasData || id === 'product_quality_flow');
      return {
        id,
        stageAvailability,
        shouldBeActiveNow,
        reason: shouldBeActiveNow
          ? (rule.preLaunchReason || flow.reason || 'Workflow is active for current stage.')
          : (flow.reason || rule.preLaunchReason || 'Waiting for required data.'),
        requiredData: rule.requiredData,
        nextUnlockCondition: shouldBeActiveNow ? null : rule.unlock,
        capabilityState: flow.capabilityState || 'no_data_yet',
        dataState: flow.dataState || 'no_data_yet',
      };
    });
    return {
      operatingStage,
      supportedStages: SUPPORTED_STAGES,
      stageWorkflows,
      nextStageUnlocks: stageWorkflows
        .filter((workflow) => !workflow.shouldBeActiveNow)
        .map((workflow) => ({
          id: workflow.id,
          nextUnlockCondition: workflow.nextUnlockCondition,
          reason: workflow.reason,
        })),
      launchReadiness: {
        status: founderReview.launchReadinessStatus || founderReview.status || 'needs_work',
        score: founderReview.launchReadinessScore ?? null,
        launchDate: founderReview.launchDate || this.config.launchDate || null,
        catalogReconciled: catalog.importedCatalogReconciled === true,
      },
      workflowCoverage: {
        activeNow: stageWorkflows.filter((workflow) => workflow.shouldBeActiveNow).map((workflow) => workflow.id),
        waitingForData: stageWorkflows
          .filter((workflow) => workflow.stageAvailability === 'available_in_stage' && !workflow.shouldBeActiveNow)
          .map((workflow) => workflow.id),
        futureStage: stageWorkflows
          .filter((workflow) => workflow.stageAvailability === 'not_active_for_stage')
          .map((workflow) => workflow.id),
      },
    };
  }
}

module.exports = {
  OperatingStageEngine,
  SUPPORTED_STAGES,
  WORKFLOW_RULES,
};
