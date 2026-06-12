const leaveService = require('../services/leaveService');
const { ForbiddenError } = require('../utils/errors');

class LeaveController {
  async getLeaves(req, res, next) {
    try {
      const { employee, status, from_date, to_date } = req.query;
      const leaves = await leaveService.getAllLeaves({
        userRole: req.user.role,
        userId: req.user.id,
        employee,
        status,
        from_date,
        to_date
      });
      res.json(leaves);
    } catch (error) {
      next(error);
    }
  }

  async getLeaveTypes(req, res, next) {
    try {
      const types = await leaveService.getLeaveTypes();
      res.json(types);
    } catch (error) {
      next(error);
    }
  }

  async getLeaveBalances(req, res, next) {
    try {
      const balances = await leaveService.getLeaveBalances();
      res.json(balances);
    } catch (error) {
      next(error);
    }
  }

  async applyLeave(req, res, next) {
    try {
      const { leave_type_id, from_date, to_date, reason } = req.body;
      const application = await leaveService.applyLeave({
        employeeId: req.user.id,
        leaveTypeId: leave_type_id,
        fromDate: from_date,
        toDate: to_date,
        reason,
        employeeName: req.user.name
      });
      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  }

  async updateLeaveStatus(req, res, next) {
    try {
      if (req.user.role === 'employee') {
        throw new ForbiddenError('Unauthorized: Access denied');
      }
      const result = await leaveService.updateLeaveStatus(
        req.params.id,
        req.body,
        req.user
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LeaveController();
