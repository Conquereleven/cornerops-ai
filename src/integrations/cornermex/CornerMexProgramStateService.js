const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const PROGRAM_STATES = Object.freeze(['verified_current', 'pending_pr', 'stale', 'drift_detected', 'malformed', 'unavailable']);
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const isSha = (value) => typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);
const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

class CornerMexProgramStateService {
  constructor({ sourceRepository = 'Conquereleven/corner-mex-uae', evidenceRoot, maxAgeMs = 86400000, now = () => new Date(), readFile = fs.readFile } = {}) {
    this.sourceRepository = sourceRepository;
    this.evidenceRoot = evidenceRoot;
    this.maxAgeMs = maxAgeMs;
    this.now = now;
    this.readFile = readFile;
  }

  async read() {
    if (!this.evidenceRoot) return this.fail('unavailable', ['canonical_evidence_root_not_configured']);
    try {
      const [currentRaw, deploymentRaw] = await Promise.all([
        this.readFile(path.join(this.evidenceRoot, 'CURRENT_STATE.json'), 'utf8'),
        this.readFile(path.join(this.evidenceRoot, 'DEPLOYMENT_REGISTRY.json'), 'utf8'),
      ]);
      let current;
      let deployments;
      try { current = JSON.parse(currentRaw); deployments = JSON.parse(deploymentRaw); } catch (_error) {
        return this.fail('malformed', ['canonical_evidence_json_malformed']);
      }
      const errors = this.validate(current, deployments);
      if (errors.length) return this.fail('malformed', errors);
      const ageMs = this.now().getTime() - Date.parse(current.evidenceTimestamp);
      const { staging, production } = deployments;
      const expectedSha = current.expectedSha || production.sha || staging.sha;
      let status = 'verified_current';
      if (ageMs < 0 || ageMs > this.maxAgeMs) status = 'stale';
      else if (isSha(current.observedSha) && isSha(expectedSha) && current.observedSha !== expectedSha) status = 'drift_detected';
      else if (current.pendingPrs.length) status = 'pending_pr';
      return {
        status,
        sourceRepository: this.sourceRepository,
        observedRef: current.observedRef || null,
        observedSha: isSha(current.observedSha) ? current.observedSha : null,
        governance: current.governance,
        stagingSha: staging.sha,
        productionSha: production.sha,
        stagingAutoDeploy: staging.autoDeploy,
        productionAutoDeploy: production.autoDeploy,
        health: current.health,
        readiness: current.readiness,
        blockers: current.blockers,
        nextActions: current.nextActions,
        pendingPrs: current.pendingPrs,
        rollbackAvailable: current.rollbackAvailable,
        evidenceTimestamp: current.evidenceTimestamp,
        freshness: { ageMs, maxAgeMs: this.maxAgeMs, fresh: status !== 'stale' },
        evidenceChecksum: sha256(`${currentRaw}\n${deploymentRaw}`),
        writesBlocked: true,
        routes: { read: true, write: false },
        warnings: production.autoDeploy ? ['production_auto_deploy_unexpectedly_active'] : [],
      };
    } catch (error) {
      return this.fail('unavailable', [error.code === 'ENOENT' ? 'canonical_evidence_file_missing' : 'canonical_evidence_source_unavailable']);
    }
  }

  validate(current, deployments) {
    const errors = [];
    if (!isObject(current)) return ['current_state_must_be_object'];
    if (!isObject(deployments)) return ['deployment_registry_must_be_object'];
    if (current.sourceRepository !== this.sourceRepository) errors.push('source_repository_mismatch');
    if (!isSha(current.observedSha) && !String(current.observedRef || '').trim()) errors.push('observed_ref_or_sha_required');
    if (!isObject(current.governance)) errors.push('governance_required');
    if (!['healthy', 'degraded', 'unhealthy'].includes(current.health)) errors.push('health_invalid');
    if (!['ready', 'degraded', 'blocked'].includes(current.readiness)) errors.push('readiness_invalid');
    for (const key of ['blockers', 'nextActions', 'pendingPrs']) if (!Array.isArray(current[key])) errors.push(`${key}_must_be_array`);
    if (typeof current.rollbackAvailable !== 'boolean') errors.push('rollback_availability_required');
    if (!current.evidenceTimestamp || Number.isNaN(Date.parse(current.evidenceTimestamp))) errors.push('evidence_timestamp_invalid');
    for (const name of ['staging', 'production']) {
      const target = deployments[name];
      if (!isObject(target) || !isSha(target.sha) || typeof target.autoDeploy !== 'boolean') errors.push(`${name}_deployment_invalid`);
    }
    return errors;
  }

  fail(status, blockers) {
    return { status, sourceRepository: this.sourceRepository, blockers, nextActions: ['provide_fresh_validated_canonical_evidence'], pendingPrs: [], evidenceTimestamp: null, freshness: { fresh: false }, evidenceChecksum: null, writesBlocked: true, routes: { read: true, write: false }, warnings: blockers };
  }
}

module.exports = { CornerMexProgramStateService, PROGRAM_STATES };
