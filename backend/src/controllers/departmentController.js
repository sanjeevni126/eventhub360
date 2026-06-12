const departmentService = require('../services/departmentService');
const { ForbiddenError } = require('../utils/errors');

class DepartmentController {
  async getDepartments(req, res, next) {
    try {
      const depts = await departmentService.getAllDepartments();
      res.json(depts);
    } catch (error) {
      next(error);
    }
  }

  async createDepartment(req, res, next) {
    try {
      if (req.user.role === 'employee' || req.user.role === 'manager') {
        throw new ForbiddenError('Unauthorized: Access denied');
      }
      const dept = await departmentService.createDepartment(req.body.department_name);
      res.status(201).json(dept);
    } catch (error) {
      next(error);
    }
  }

  async deleteDepartment(req, res, next) {
    try {
      if (req.user.role === 'employee' || req.user.role === 'manager') {
        throw new ForbiddenError('Unauthorized: Access denied');
      }
      const result = await departmentService.deleteDepartment(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DepartmentController();
