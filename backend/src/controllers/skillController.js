const skillService = require('../services/skillService');

class SkillController {
  async getSkills(req, res, next) {
    try {
      const skills = await skillService.getAllSkills();
      res.json(skills);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SkillController();
