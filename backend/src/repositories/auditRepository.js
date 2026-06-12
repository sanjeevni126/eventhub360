const db = require('../config/db');

class AuditRepository {
  async logAction(tableName, actionType, recordId, oldData, newData, performedBy) {
    const query = `
      INSERT INTO audit_logs (table_name, action_type, record_id, old_data, new_data, performed_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const oldDataStr = oldData ? JSON.stringify(oldData) : null;
    const newDataStr = newData ? JSON.stringify(newData) : null;
    await db.query(query, [tableName, actionType, recordId, oldDataStr, newDataStr, performedBy]);
  }

  async findAll() {
    const query = `
      SELECT al.id, al.created_at as time, u.name as user, al.action_type as action, al.table_name as module, al.new_data as details
      FROM audit_logs al
      LEFT JOIN users u ON al.performed_by = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = new AuditRepository();
