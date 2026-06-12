const attendanceService = require('../services/attendanceService');

class AttendanceController {
  async checkIn(req, res, next) {
    try {
      const attendance = await attendanceService.checkIn(req.user.id);
      res.status(201).json({ message: 'Checked in successfully', attendance });
    } catch (error) {
      if (error.message === 'Already checked in for today') {
        res.status(400).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async checkOut(req, res, next) {
    try {
      const attendance = await attendanceService.checkOut(req.user.id);
      res.json({ message: 'Checked out successfully', attendance });
    } catch (error) {
      if (error.message.includes('check in first') || error.message.includes('Already checked out')) {
        res.status(400).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async getAttendance(req, res, next) {
    try {
      const attendanceList = await attendanceService.getAttendance(req.user);
      res.json(attendanceList);
    } catch (error) {
      next(error);
    }
  }

  async getTodayStatus(req, res, next) {
    try {
      const status = await attendanceService.getTodayStatus(req.user.id);
      res.json({ status: status || null });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
