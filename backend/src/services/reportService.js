const db = require('../config/db');

class ReportService {
  async getEmployeeReport() {
    const query = `
      SELECT u.name, u.email, d.department_name as department, ep.designation, ep.salary, ep.working_mode, u.role
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      ORDER BY u.id ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async getLeaveReport() {
    const query = `
      SELECT u.name as employee, lt.leave_name as type, la.from_date, la.to_date, la.total_days as days, la.status
      FROM leave_applications la
      JOIN users u ON la.employee_id = u.id
      JOIN leave_types lt ON la.leave_type_id = lt.id
      ORDER BY la.from_date DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async getAssetReport() {
    const query = `
      SELECT a.asset_name as asset, a.asset_type as type, a.status, u.name as assigned_to
      FROM assets a
      LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.status = 'Active'
      LEFT JOIN users u ON aa.employee_id = u.id
      ORDER BY a.id ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = new ReportService();
