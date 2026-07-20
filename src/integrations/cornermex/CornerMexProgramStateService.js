const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { CornerMexProgramEvidenceNormalizer } = require('./CornerMexProgramEvidenceNormalizer');

const PROGRAM_STATES = Object.freeze(['verified_current', 'pending_pr', 'stale', 'drift_detected', 'malformed', 'unavailable']);
const DEFAULT_MAX_AGE_MS = 86400000;
const MAX_MAX_AGE_MS = 7 * 86400000;
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const asMaxAge = (value) => Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= MAX_MAX_AGE_MS ? Number(value) : DEFAULT_MAX_AGE_MS;

class CornerMexProgramStateService {
  constructor({ sourceRepository = 'Conquereleven/corner-mex-uae', evidenceRoot, maxAgeMs = DEFAULT_MAX_AGE_MS, now = () => new Date(), readFile = fs.readFile, normalizer = new CornerMexProgramEvidenceNormalizer() } = {}) {
    this.sourceRepository = sourceRepository; this.evidenceRoot = evidenceRoot; this.maxAgeMs = asMaxAge(maxAgeMs); this.configurationWarnings = this.maxAgeMs === Number(maxAgeMs) ? [] : ['invalid_evidence_max_age_defaulted']; this.now = now; this.readFile = readFile; this.normalizer = normalizer;
    this.lastSuccessfulRead = null;
  }

  async read() {
    if (!this.evidenceRoot) return this.fail('unavailable', ['canonical_evidence_root_not_configured']);
    try {
      const [currentRaw, registryRaw] = await Promise.all([
        this.readFile(path.resolve(this.evidenceRoot, 'CURRENT_STATE.json'), 'utf8'),
        this.readFile(path.resolve(this.evidenceRoot, 'DEPLOYMENT_REGISTRY.json'), 'utf8'),
      ]);
      let current; let registry;
      try { current = JSON.parse(currentRaw); registry = JSON.parse(registryRaw); } catch (_error) { return this.fail('malformed', ['canonical_evidence_json_malformed']); }
      let state;
      try { state = this.normalizer.normalize(current, registry); } catch (error) { return this.fail('malformed', [error.message]); }
      const blockers = Array.isArray(state.blockers) ? [...state.blockers] : [];
      const warnings = [...this.configurationWarnings];
      const governanceDrift = state.productionAutoDeploy === true || /github_push|merge/i.test(state.productionTrigger);
      if (state.productionAutoDeploy === true) { blockers.push('production_auto_deploy_unexpectedly_active'); warnings.push('production_auto_deploy_unexpectedly_active'); }
      if (/github_push|merge/i.test(state.productionTrigger)) { blockers.push('dangerous_production_trigger'); warnings.push('dangerous_production_trigger'); }
      if (state.generationMismatch) blockers.push('canonical_evidence_generation_mismatch');
      const sourceDrift = state.repositoryMismatch || state.sourceRepository !== this.sourceRepository || state.observedSha !== state.currentSourceCommit || state.observedSha !== state.expectedSha || state.stagingSha !== state.currentSourceCommit || state.productionSha !== state.currentSourceCommit;
      if (state.repositoryMismatch || state.sourceRepository !== this.sourceRepository) blockers.push('source_repository_mismatch');
      const ageMs = this.now().getTime() - Date.parse(state.evidenceTimestamp);
      const expiredByContract = state.freshUntil !== 'not_provided' && this.now().getTime() > Date.parse(state.freshUntil);
      let status = 'verified_current';
      if (governanceDrift || state.generationMismatch || sourceDrift) status = 'drift_detected';
      else if (ageMs < 0 || ageMs > this.maxAgeMs || expiredByContract) status = 'stale';
      else if (Array.isArray(state.pendingPrs) && state.pendingPrs.length) status = 'pending_pr';
      this.lastSuccessfulRead = this.now().toISOString();
      return { ...state, status, blockers, warnings, evidenceChecksum: sha256(`${currentRaw}\n${registryRaw}`), freshness: { ageMs, maxAgeMs: this.maxAgeMs, fresh: status !== 'stale', freshUntil: state.freshUntil }, configuration: { evidenceRootConfigured: true, directoryAccessible: true, requiredFilesPresent: true, schemaVersionsSupported: true, maxAgeMs: this.maxAgeMs, warnings: this.configurationWarnings, lastSuccessfulRead: this.lastSuccessfulRead }, writesBlocked: true, routes: { read: true, write: false } };
    } catch (error) { return this.fail('unavailable', [error.code === 'ENOENT' ? 'canonical_evidence_file_missing' : 'canonical_evidence_source_unavailable']); }
  }

  fail(status, blockers) {
    return { status, sourceRepository: this.sourceRepository, schemaVersions: 'unavailable', blockers, nextActions: 'unavailable', pendingPrs: 'not_provided', evidenceTimestamp: null, freshness: { fresh: false, maxAgeMs: this.maxAgeMs }, evidenceChecksum: null, configuration: { evidenceRootConfigured: Boolean(this.evidenceRoot), directoryAccessible: false, requiredFilesPresent: false, schemaVersionsSupported: false, maxAgeMs: this.maxAgeMs, warnings: this.configurationWarnings, lastSuccessfulRead: this.lastSuccessfulRead }, writesBlocked: true, routes: { read: true, write: false }, warnings: [...blockers, ...this.configurationWarnings] };
  }
}

module.exports = { CornerMexProgramStateService, PROGRAM_STATES, DEFAULT_MAX_AGE_MS, MAX_MAX_AGE_MS };
