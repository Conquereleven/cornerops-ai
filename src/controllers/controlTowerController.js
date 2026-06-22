const { controlTowerService } = require('../core/control-tower');

const status = async (req, res, next) => {
  try {
    return res.json(await controlTowerService.getReport());
  } catch (error) {
    return next(error);
  }
};

const beta = async (req, res, next) => {
  try {
    return res.json(await controlTowerService.getBetaReport());
  } catch (error) {
    return next(error);
  }
};

const dataContracts = async (req, res, next) => {
  try {
    await controlTowerService.businessDataService.ensureReady({ agentId: 'control-tower-api' });
    return res.json(controlTowerService.dataContractRegistry.listMappings());
  } catch (error) {
    return next(error);
  }
};

const schemaDiscovery = async (req, res, next) => {
  try {
    await controlTowerService.businessDataService.ensureReady({ agentId: 'control-tower-api' });
    return res.json(controlTowerService.businessDataService.getSchemaReport());
  } catch (error) {
    return next(error);
  }
};

const security = (req, res) => res.json(controlTowerService.getSecurityReport());

const approvals = async (req, res, next) => {
  try {
    return res.json(await controlTowerService.getApprovalsSummary());
  } catch (error) {
    return next(error);
  }
};

const auditSummary = async (req, res, next) => {
  try {
    return res.json(await controlTowerService.getAuditSummary());
  } catch (error) {
    return next(error);
  }
};

module.exports = { approvals, auditSummary, beta, dataContracts, schemaDiscovery, security, status };
