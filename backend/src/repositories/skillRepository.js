const db = require('../config/db');

class SkillRepository {
  async findAll() {
    const result = await db.query('SELECT * FROM skills ORDER BY id ASC');
    return result.rows;
  }
}

module.exports = new SkillRepository();
