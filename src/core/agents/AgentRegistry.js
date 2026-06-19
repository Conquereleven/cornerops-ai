const fs = require('fs');
const path = require('path');
const { coreAgentDefinitions } = require('./definitions');

const cloneAgent = (agent) => ({
  ...agent,
  allowedChannels: [...agent.allowedChannels],
  allowedTools: [...agent.allowedTools],
  requiresHumanApprovalFor: [...agent.requiresHumanApprovalFor],
});

class AgentRegistry {
  constructor({
    agents = coreAgentDefinitions,
    agentsEnabled = true,
    enabledAgentIds = [],
    disabledAgentIds = [],
    rootDir = process.cwd(),
  } = {}) {
    this.agentsEnabled = agentsEnabled;
    this.enabledAgentIds = new Set(enabledAgentIds);
    this.disabledAgentIds = new Set(disabledAgentIds);
    this.rootDir = rootDir;
    this.agents = new Map();
    agents.forEach((agent) => this.register(agent));
  }

  register(agent) {
    if (!agent?.id) {
      throw new Error('Agent definition requires an id.');
    }
    if (this.agents.has(agent.id)) {
      throw new Error(`Duplicate agent id: ${agent.id}`);
    }
    this.agents.set(agent.id, cloneAgent(agent));
    return this.get(agent.id);
  }

  list() {
    return [...this.agents.values()].map((agent) => this.withEffectiveState(agent));
  }

  listActive() {
    return this.list().filter((agent) => agent.enabled);
  }

  get(id) {
    const agent = this.agents.get(id);
    return agent ? this.withEffectiveState(agent) : null;
  }

  has(id) {
    return this.agents.has(id);
  }

  setEnabled(id, enabled) {
    const agent = this.agents.get(id);
    if (!agent) return null;
    agent.enabled = Boolean(enabled);
    return this.get(id);
  }

  getPermissionMetadata(id) {
    const agent = this.get(id);
    if (!agent) return null;
    return {
      id: agent.id,
      permissionLevel: agent.permissionLevel,
      allowedChannels: [...agent.allowedChannels],
      allowedTools: [...agent.allowedTools],
      requiresHumanApprovalFor: [...agent.requiresHumanApprovalFor],
    };
  }

  getBasePrompt(id) {
    const agent = this.get(id);
    if (!agent) return null;
    const promptPath = path.resolve(this.rootDir, agent.systemPromptPath);
    return fs.readFileSync(promptPath, 'utf8');
  }

  getAllowedTools(id) {
    const agent = this.get(id);
    return agent ? [...agent.allowedTools] : [];
  }

  withEffectiveState(agent) {
    const explicitlyEnabled = this.enabledAgentIds.size === 0
      || this.enabledAgentIds.has(agent.id);
    const enabled = Boolean(
      this.agentsEnabled &&
      agent.enabled &&
      explicitlyEnabled &&
      !this.disabledAgentIds.has(agent.id),
    );
    return {
      ...cloneAgent(agent),
      enabled,
    };
  }
}

module.exports = {
  AgentRegistry,
};
