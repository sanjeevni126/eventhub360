const payrollService = require('../services/payrollService');

class PayrollController {
  async getPayroll(req, res, next) {
    try {
      const { search, city, department, workingMode, minSalary, maxSalary } = req.query;
      const payrollData = await payrollService.getPayrollData({
        search,
        city,
        department,
        workingMode,
        minSalary,
        maxSalary
      });
      res.json(payrollData);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PayrollController();
