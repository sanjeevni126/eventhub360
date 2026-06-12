const departmentRepository = require('../repositories/departmentRepository');
const { NotFoundError, BadRequestError } = require('../utils/errors');

class DepartmentService {
  async getAllDepartments() {
    return await departmentRepository.findAll();
  }

  async createDepartment(departmentName) {
    if (!departmentName) {
      throw new BadRequestError('Department name is required');
    }
    try {
      return await departmentRepository.create(departmentName);
    } catch (error) {
      throw new BadRequestError('Department name already exists or is invalid');
    }
  }

  async deleteDepartment(id) {
    const deleted = await departmentRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Department not found');
    }
    return { message: 'Deleted successfully' };
  }
}

module.exports = new DepartmentService();
