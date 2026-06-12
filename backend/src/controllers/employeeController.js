const employeeService = require('../services/employeeService');
const { ForbiddenError } = require('../utils/errors');

class EmployeeController {
  async getEmployees(req, res, next) {
    try {
      const { page, limit, search, department } = req.query;
      const { data, total } = await employeeService.getAllEmployees({ page, limit, search, department });
      
      res.setHeader('X-Total-Count', total);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeById(req, res, next) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      res.json(employee);
    } catch (error) {
      next(error);
    }
  }

  async createEmployee(req, res, next) {
    try {
      if (req.user.role === 'employee') {
        throw new ForbiddenError('Unauthorized: Access denied');
      }
      const result = await employeeService.createEmployee(req.body, req.user);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(req, res, next) {
    try {
      if (req.user.role === 'employee') {
        throw new ForbiddenError('Unauthorized: Access denied');
      }
      const result = await employeeService.updateEmployee(req.params.id, req.body, req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteEmployee(req, res, next) {
    try {
      if (req.user.role === 'employee') {
        throw new ForbiddenError('Unauthorized: Access denied');
      }
      const result = await employeeService.deleteEmployee(req.params.id, req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployeeController();
