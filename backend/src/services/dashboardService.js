const db = require('../config/db');

class DashboardService {
  async getStats() {
    const empResult = await db.query('SELECT COUNT(*) as count FROM users');
    const deptResult = await db.query('SELECT COUNT(*) as count FROM departments');
    const skillsResult = await db.query('SELECT COUNT(*) as count FROM skills');
    
    const pendingResult = await db.query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'Pending'");
    const approvedResult = await db.query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'Approved'");
    const rejectedResult = await db.query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'Rejected'");
    
    const salaryResult = await db.query('SELECT SUM(salary) as total FROM employee_profiles');
    
    const deptDistResult = await db.query(`
      SELECT 
        d.department_name as name, 
        COUNT(u.id)::int as value
      FROM departments d
      JOIN employee_profiles ep ON d.id = ep.department_id
      JOIN users u ON ep.user_id = u.id
      GROUP BY d.id, d.department_name
      HAVING COUNT(u.id) > 0
    `);

    const modeResult = await db.query(`
      SELECT 
        COALESCE(ep.working_mode, 'Onsite') as mode,
        COUNT(u.id)::int as count
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      GROUP BY COALESCE(ep.working_mode, 'Onsite')
    `);
    
    const modes = {
      Online: 0,
      Offline: 0,
      Hybrid: 0
    };
    
    modeResult.rows.forEach(row => {
      if (row.mode === 'Remote') {
        modes.Online = row.count;
      } else if (row.mode === 'Hybrid') {
        modes.Hybrid = row.count;
      } else {
        modes.Offline = row.count;
      }
    });

    return {
      totalEmployees: parseInt(empResult.rows[0].count, 10),
      totalDepartments: parseInt(deptResult.rows[0].count, 10),
      totalSkills: parseInt(skillsResult.rows[0].count, 10),
      pendingLeaves: parseInt(pendingResult.rows[0].count, 10),
      approvedLeaves: parseInt(approvedResult.rows[0].count, 10),
      rejectedLeaves: parseInt(rejectedResult.rows[0].count, 10),
      totalSalaryExpense: parseInt(salaryResult.rows[0].total, 10) || 0,
      departmentDistribution: deptDistResult.rows,
      workingModeDistribution: [
        { name: 'Online', value: modes.Online },
        { name: 'Hybrid', value: modes.Hybrid },
        { name: 'Offline', value: modes.Offline }
      ]
    };
  }
}

module.exports = new DashboardService();
