const reportService = require('../services/reportService');

class ReportController {
  async getEmployeeReport(req, res, next) {
    try {
      const report = await reportService.getEmployeeReport();
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async getLeaveReport(req, res, next) {
    try {
      const report = await reportService.getLeaveReport();
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async getAssetReport(req, res, next) {
    try {
      const report = await reportService.getAssetReport();
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
