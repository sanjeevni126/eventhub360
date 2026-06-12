const db = require('../config/db');

class EmployeeRepository {
  async findAll({ page, limit, search, department }) {
    let query = `
      SELECT 
        u.id, u.name, u.email, u.role, 
        ep.designation, ep.phone, ep.working_mode, d.department_name as department
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    if (department) {
      params.push(department);
      query += ` AND d.department_name ILIKE $${params.length}`;
    }

    query += ` ORDER BY u.id ASC`;

    if (page && limit) {
      const limitVal = parseInt(limit, 10);
      const offsetVal = (parseInt(page, 10) - 1) * limitVal;
      params.push(limitVal, offsetVal);
      query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  async countAll({ search, department }) {
    let query = `
      SELECT COUNT(*)
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON ep.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    if (department) {
      params.push(department);
      query += ` AND d.department_name ILIKE $${params.length}`;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  async findById(id) {
    const query = `
      SELECT 
        u.id, u.name, u.email, u.role, 
        ep.id as profile_id, ep.designation, ep.phone, ep.address, ep.salary, ep.working_mode, ep.department_id
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE u.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findSkillsByProfileId(profileId) {
    const result = await db.query(
      `SELECT s.id, s.skill_name 
       FROM employee_skills es
       JOIN skills s ON es.skill_id = s.id
       WHERE es.employee_id = $1`,
      [profileId]
    );
    return result.rows;
  }

  async updateUser(id, { name, email, role }, client = db) {
    const result = await client.query(
      `UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING *`,
      [name, email, role, id]
    );
    return result.rows[0];
  }

  async updateProfile(userId, { phone, department_id, designation, salary, address, working_mode }, client = db) {
    const result = await client.query(
      `UPDATE employee_profiles 
       SET phone = $1, department_id = $2, designation = $3, salary = $4, address = $5, working_mode = $6
       WHERE user_id = $7 RETURNING id`,
      [phone, department_id || null, designation, salary || 0, address, working_mode || 'Onsite', userId]
    );
    return result.rows[0];
  }

  async clearSkills(profileId, client = db) {
    await client.query(`DELETE FROM employee_skills WHERE employee_id = $1`, [profileId]);
  }

  async addSkills(profileId, skills, client = db) {
    const values = skills.map((_, i) => `($1, $${i+2})`).join(', ');
    const params = [profileId, ...skills];
    await client.query(`INSERT INTO employee_skills (employee_id, skill_id) VALUES ${values}`, params);
  }

  async deleteUser(id) {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = new EmployeeRepository();
