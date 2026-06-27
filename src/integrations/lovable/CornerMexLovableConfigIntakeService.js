const { CornerMexLovableConfigValidator } = require('./CornerMexLovableConfigValidator');

class CornerMexLovableConfigIntakeService {
  constructor({
    config = {},
    discoveryService,
    validator = new CornerMexLovableConfigValidator({ config }),
  } = {}) {
    this.config = config;
    this.discoveryService = discoveryService;
    this.validator = validator;
  }

  async check(context = {}) {
    const validation = this.validator.validate();
    const discovery = this.discoveryService?.discover
      ? await this.discoveryService.discover(context)
      : null;
    return {
      version: 'v1.1.2',
      status: validation.status,
      sourceModeCandidate: validation.sourceModeCandidate,
      currentMode: discovery?.sourceMode || validation.sourceModeCandidate,
      canReachRepoDiscovered: validation.canReachRepoDiscovered,
      canReachRealReadOnly: validation.canReachRealReadOnly,
      configCompleteness: validation.configCompleteness,
      readOnlyFlags: validation.readOnlyFlags,
      limits: validation.limits,
      missing: validation.missing,
      unsafe: validation.unsafe,
      secrets: validation.secrets,
      repoDiscovery: discovery?.repo || null,
      supabaseDiscovery: discovery?.supabase || null,
      warnings: [...new Set([...(discovery?.warnings || []), ...validation.unsafe])],
      founderNextSteps: validation.nextSteps,
    };
  }
}

module.exports = { CornerMexLovableConfigIntakeService };
