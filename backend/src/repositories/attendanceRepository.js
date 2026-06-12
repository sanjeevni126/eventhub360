const db = require('../config/db');

class AttendanceRepository {
  async getAttendanceByEmployeeIdAndDate(employeeId, date) {
    const result = await db.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, date]
    );
    return result.rows[0];
  }

  async createAttendance(employeeId, date, checkInTime) {
    const result = await db.query(
      `INSERT INTO attendance (employee_id, date, check_in_time) 
       VALUES ($1, $2, $3) RETURNING *`,
      [employeeId, date, checkInTime]
    );
    return result.rows[0];
  }

  async updateCheckOut(id, checkOutTime) {
    const result = await db.query(
      'UPDATE attendance SET check_out_time = $1 WHERE id = $2 RETURNING *',
      [checkOutTime, id]
    );
    return result.rows[0];
  }

  async getAllAttendance() {
    const result = await db.query(`
      SELECT a.*, u.name as employee_name, d.department_name
      FROM attendance a
      JOIN users u ON a.employee_id = u.id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      ORDER BY a.date DESC, a.check_in_time DESC
    `);
    return result.rows;
  }

  async getAttendanceByEmployee(employeeId) {
    const result = await db.query(`
      SELECT * FROM attendance 
      WHERE employee_id = $1 
      ORDER BY date DESC
    `, [employeeId]);
    return result.rows;
  }
}

module.exports = new AttendanceRepository();
