const db = require('../config/db');

class AuthRepository {
  async findByEmail(email) {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.password, u.role, ep.designation
       FROM users u
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0];
  }

  async createUser(name, email, password, role) {
    const result = await db.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role`,
      [name, email, password, role]
    );
    return result.rows[0];
  }

  async createProfile(userId, designation) {
    const result = await db.query(
      `INSERT INTO employee_profiles (user_id, designation) 
       VALUES ($1, $2) 
       RETURNING *`,
      [userId, designation || '']
    );
    return result.rows[0];
  }

  async updatePassword(email, newPasswordHash) {
    const result = await db.query(
      `UPDATE users SET password = $1 WHERE email = $2 RETURNING id`,
      [newPasswordHash, email]
    );
    return result.rows[0];
  }
}

module.exports = new AuthRepository();
