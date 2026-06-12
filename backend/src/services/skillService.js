const skillRepository = require('../repositories/skillRepository');

class SkillService {
  async getAllSkills() {
    return await skillRepository.findAll();
  }
}

module.exports = new SkillService();
