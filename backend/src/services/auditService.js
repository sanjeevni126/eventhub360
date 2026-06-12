const auditRepository = require('../repositories/auditRepository');

class AuditService {
  async getAllAuditLogs() {
    return await auditRepository.findAll();
  }
}

module.exports = new AuditService();
