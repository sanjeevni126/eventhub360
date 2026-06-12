const db = require('../config/db');

class LeaveRepository {
  async findAll({ userRole, userId, employee, status, from_date, to_date }) {
    let query = `
      SELECT la.id, la.employee_id, u.name as employee_name, lt.leave_name as leave_type, la.leave_type_id,
             la.from_date, la.to_date, la.reason, la.status, la.total_days
      FROM leave_applications la
      JOIN users u ON la.employee_id = u.id
      JOIN leave_types lt ON la.leave_type_id = lt.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based constraints
    if (userRole === 'employee') {
      params.push(userId);
      query += ` AND la.employee_id = $${params.length}`;
    } else if (employee) {
      // Admin/HR can filter by employee ID or name
      if (isNaN(employee)) {
        params.push(`%${employee}%`);
        query += ` AND u.name ILIKE $${params.length}`;
      } else {
        params.push(parseInt(employee, 10));
        query += ` AND la.employee_id = $${params.length}`;
      }
    }

    if (status) {
      params.push(status);
      query += ` AND la.status = $${params.length}`;
    }

    if (from_date) {
      params.push(from_date);
      query += ` AND la.from_date >= $${params.length}`;
    }

    if (to_date) {
      params.push(to_date);
      query += ` AND la.to_date <= $${params.length}`;
    }

    query += ` ORDER BY la.id DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  async findTypes() {
    const result = await db.query('SELECT * FROM leave_types ORDER BY id ASC');
    return result.rows;
  }

  async findBalances() {
    const query = `
      SELECT u.id, u.name as employee_name, lt.leave_name, lb.available_days
      FROM leave_balance lb
      JOIN users u ON lb.employee_id = u.id
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      ORDER BY u.id ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async findById(id, client = db) {
    const result = await client.query(
      `SELECT la.*, lt.leave_name, u.name as employee_name, u.email as employee_email 
       FROM leave_applications la
       JOIN leave_types lt ON la.leave_type_id = lt.id
       JOIN users u ON la.employee_id = u.id
       WHERE la.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  async findBalanceForEmployee(employeeId, leaveTypeId, client = db) {
    const result = await client.query(
      'SELECT available_days FROM leave_balance WHERE employee_id = $1 AND leave_type_id = $2',
      [employeeId, leaveTypeId]
    );
    return result.rows[0] ? result.rows[0].available_days : null;
  }

  async updateBalance(employeeId, leaveTypeId, newBalance, client = db) {
    await client.query(
      'UPDATE leave_balance SET available_days = $1 WHERE employee_id = $2 AND leave_type_id = $3',
      [newBalance, employeeId, leaveTypeId]
    );
  }

  async createApplication({ employeeId, leaveTypeId, fromDate, toDate, totalDays, reason }, client = db) {
    const result = await client.query(
      `INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, total_days, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending') RETURNING *`,
      [employeeId, leaveTypeId, fromDate, toDate, totalDays, reason]
    );
    return result.rows[0];
  }

  async getLeaveTypeName(leaveTypeId, client = db) {
    const result = await client.query('SELECT leave_name FROM leave_types WHERE id = $1', [leaveTypeId]);
    return result.rows[0] ? result.rows[0].leave_name : 'Leave';
  }

  async updateStatus(id, status, client = db) {
    const result = await client.query(
      'UPDATE leave_applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  async addApprovalHistory({ leaveId, approvedBy, action, remarks }, client = db) {
    const result = await client.query(
      `INSERT INTO approval_history (leave_id, approved_by, action, remarks) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [leaveId, approvedBy, action, remarks || '']
    );
    return result.rows[0];
  }
}

module.exports = new LeaveRepository();
