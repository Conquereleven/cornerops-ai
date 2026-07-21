const CURRENT_SCHEMA = 'joint-program-state-v1';
const REGISTRY_SCHEMA = 'cornermex-deployment-registry-v2';
const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isSha = (value) => typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);

class CornerMexProgramEvidenceNormalizer {
  supports(current, registry) {
    return current?.schemaVersion === CURRENT_SCHEMA && registry?.schemaVersion === REGISTRY_SCHEMA;
  }

  normalize(current, registry) {
    if (!isObject(current) || !isObject(registry)) throw new Error('canonical_documents_must_be_objects');
    if (!this.supports(current, registry)) throw new Error('unsupported_canonical_schema_version');
    const repository = current.authority?.repository;
    if (!repository || !registry.repository) throw new Error('source_repository_missing');
    const repositoryMismatch = repository !== registry.repository;
    const contexts = registry.governance?.contexts;
    const expected = registry.expectedContexts;
    if (!Array.isArray(contexts) || !Array.isArray(expected) || !Array.isArray(registry.deployments)) throw new Error('canonical_deployment_collections_invalid');
    const context = (environment) => contexts.find((item) => item?.environment === environment);
    const identity = (environment) => expected.find((item) => item?.environment === environment);
    const active = (environment) => registry.deployments.find((item) => item?.environment === environment && item?.state === 'SUCCESS' && item?.instanceState === 'RUNNING');
    const stagingContext = context('staging'); const productionContext = context('production');
    const stagingIdentity = identity('staging'); const productionIdentity = identity('production');
    const staging = active('staging'); const production = active('production');
    if (![stagingContext, productionContext, stagingIdentity, productionIdentity, staging, production].every(isObject)) throw new Error('canonical_current_deployment_identity_missing');
    if (staging.service !== stagingIdentity.service || production.service !== productionIdentity.service
      || staging.environmentId !== stagingIdentity.environmentId || production.environmentId !== productionIdentity.environmentId) throw new Error('staging_production_identity_swapped');
    const observedSha = current.authority?.observedMainSha;
    const expectedSha = current.authority?.expectedMainSha;
    const currentSourceCommit = registry.currentSourceCommit;
    if (![observedSha, expectedSha, currentSourceCommit, staging.sourceCommit, production.sourceCommit].every(isSha)) throw new Error('canonical_source_sha_invalid');
    const observedAt = current.evidence?.observedAt || current.generatedAt;
    const registryObservedAt = registry.observedAt;
    if (!observedAt || !registryObservedAt || Number.isNaN(Date.parse(observedAt)) || Number.isNaN(Date.parse(registryObservedAt))) throw new Error('evidence_timestamp_invalid');
    const generationMismatch = observedAt !== registryObservedAt;
    return {
      schemaVersions: { currentState: CURRENT_SCHEMA, deploymentRegistry: REGISTRY_SCHEMA },
      sourceRepository: repository, observedSha, expectedSha, currentSourceCommit,
      governance: { model: registry.governance?.model || 'not_provided', contexts: { staging: stagingContext, production: productionContext } },
      stagingIdentity, productionIdentity,
      stagingSha: staging.sourceCommit, productionSha: production.sourceCommit,
      stagingAutoDeploy: stagingContext.autoDeploy, productionAutoDeploy: productionContext.autoDeploy,
      productionTrigger: productionContext.trigger || 'not_provided',
      health: current.readiness?.runtime?.stagingHealth || staging.healthState || 'not_provided',
      readiness: { staging: current.readiness?.runtime?.stagingReadiness || staging.readinessState || 'not_provided', production: current.readiness?.runtime?.productionReadiness || production.readinessState || 'not_provided' },
      productionInstance: current.readiness?.runtime?.productionInstance || production.instanceState || 'not_provided',
      blockers: Array.isArray(current.program?.blockers) ? current.program.blockers : 'not_provided',
      nextActions: Array.isArray(current.program?.nextActions) ? current.program.nextActions : 'not_provided',
      pendingPrs: 'not_provided', rollbackTarget: registry.rollback?.targetCommit || 'not_provided',
      rollbackAvailability: registry.rollback?.availability || 'not_provided', evidenceTimestamp: observedAt,
      freshUntil: current.evidence?.freshUntil || 'not_provided', generationMismatch, repositoryMismatch,
    };
  }
}

module.exports = { CornerMexProgramEvidenceNormalizer, CURRENT_SCHEMA, REGISTRY_SCHEMA };
