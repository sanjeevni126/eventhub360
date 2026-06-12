const auditService = require('../services/auditService');
const { ForbiddenError } = require('../utils/errors');

class AuditController {
  async getAuditLogs(req, res, next) {
    try {
      if (req.user.role === 'employee' || req.user.role === 'manager') {
        throw new ForbiddenError('Unauthorized: Access denied');
      }
      const logs = await auditService.getAllAuditLogs();
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
