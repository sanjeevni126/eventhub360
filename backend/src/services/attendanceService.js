const attendanceRepository = require('../repositories/attendanceRepository');

class AttendanceService {
  async checkIn(employeeId) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const existing = await attendanceRepository.getAttendanceByEmployeeIdAndDate(employeeId, today);
    if (existing) {
      throw new Error('Already checked in for today');
    }

    const checkInTime = new Date();
    return await attendanceRepository.createAttendance(employeeId, today, checkInTime);
  }

  async checkOut(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    
    const existing = await attendanceRepository.getAttendanceByEmployeeIdAndDate(employeeId, today);
    if (!existing) {
      throw new Error('You must check in first before checking out');
    }

    if (existing.check_out_time) {
      throw new Error('Already checked out for today');
    }

    const checkOutTime = new Date();
    return await attendanceRepository.updateCheckOut(existing.id, checkOutTime);
  }

  async getAttendance(user) {
    if (user.role === 'admin' || user.role === 'hr') {
      return await attendanceRepository.getAllAttendance();
    }
    return await attendanceRepository.getAttendanceByEmployee(user.id);
  }

  async getTodayStatus(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    return await attendanceRepository.getAttendanceByEmployeeIdAndDate(employeeId, today);
  }
}

module.exports = new AttendanceService();
