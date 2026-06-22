class AgentSkillsCatalog {
  constructor({ clawhubSkillRegistryAdapter } = {}) {
    this.clawhubSkillRegistryAdapter = clawhubSkillRegistryAdapter;
    this.internalSkills = [
      { id: 'context.search', name: 'Search local context', status: 'approved', riskLevel: 'low', permissions: ['read_context'] },
      { id: 'context.health', name: 'Read context health', status: 'approved', riskLevel: 'low', permissions: ['read_context_health'] },
    ];
  }

  async listApprovedSkills(context = {}) {
    const clawhubSkills = await this.clawhubSkillRegistryAdapter?.listApprovedSkills?.(context).catch(() => []);
    return [...this.internalSkills, ...(clawhubSkills || [])].filter((skill) => skill.status === 'approved');
  }

  async isAllowed(skillId, context = {}) {
    const skills = await this.listApprovedSkills(context);
    return skills.some((skill) => skill.id === skillId);
  }
}

module.exports = {
  AgentSkillsCatalog,
};
