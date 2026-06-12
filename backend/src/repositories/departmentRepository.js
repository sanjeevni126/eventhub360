const db = require('../config/db');

class DepartmentRepository {
  async findAll() {
    const query = `
      SELECT d.id, d.department_name, COUNT(ep.id) as employee_count
      FROM departments d
      LEFT JOIN employee_profiles ep ON d.id = ep.department_id
      GROUP BY d.id, d.department_name
      ORDER BY d.id ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async create(departmentName) {
    const result = await db.query(
      'INSERT INTO departments (department_name) VALUES ($1) RETURNING *',
      [departmentName]
    );
    return result.rows[0];
  }

  async delete(id) {
    const result = await db.query(
      'DELETE FROM departments WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = new DepartmentRepository();
