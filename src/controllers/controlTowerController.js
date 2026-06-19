const { controlTowerService } = require('../core/control-tower');

const status = async (req, res, next) => {
  try {
    return res.json(await controlTowerService.getReport());
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

module.exports = { approvals, auditSummary, security, status };
