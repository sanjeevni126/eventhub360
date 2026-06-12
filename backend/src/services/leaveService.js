const { pool } = require('../config/db');
const leaveRepository = require('../repositories/leaveRepository');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

class LeaveService {
  async getAllLeaves(filters) {
    return await leaveRepository.findAll(filters);
  }

  async getLeaveTypes() {
    return await leaveRepository.findTypes();
  }

  async getLeaveBalances() {
    const rows = await leaveRepository.findBalances();
    const balances = {};
    rows.forEach(row => {
      if (!balances[row.id]) {
        balances[row.id] = { id: row.id, employee: row.employee_name, Casual: 'N/A', Sick: 'N/A', Earned: 'N/A', Maternity: 'N/A' };
      }
      if (row.leave_name === 'Casual Leave') balances[row.id].Casual = row.available_days;
      if (row.leave_name === 'Sick Leave') balances[row.id].Sick = row.available_days;
      if (row.leave_name === 'Earned Leave') balances[row.id].Earned = row.available_days;
      if (row.leave_name === 'Maternity Leave') balances[row.id].Maternity = row.available_days;
    });
    return Object.values(balances);
  }

  async applyLeave({ employeeId, leaveTypeId, fromDate, toDate, reason, employeeName }) {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid from_date or to_date format');
    }
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays <= 0) {
      throw new BadRequestError('End date must be on or after start date');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check balance before applying (optional safety check)
      const currentBalance = await leaveRepository.findBalanceForEmployee(employeeId, leaveTypeId, client);
      if (currentBalance !== null && currentBalance < totalDays) {
        throw new BadRequestError(`Insufficient leave balance. Available: ${currentBalance} days, Requested: ${totalDays} days`);
      }

      const application = await leaveRepository.createApplication({
        employeeId,
        leaveTypeId,
        fromDate,
        toDate,
        totalDays,
        reason
      }, client);

      const leaveName = await leaveRepository.getLeaveTypeName(leaveTypeId, client);

      // Create notification
      await client.query(
        `INSERT INTO notifications (user_id, title, message) VALUES (NULL, 'Leave Applied', $1)`,
        [`${employeeName} applied for ${leaveName} (${totalDays} days)`]
      );

      // Create Audit log
      await client.query(
        `INSERT INTO audit_logs (table_name, action_type, record_id, performed_by, new_data) 
         VALUES ('Leave', 'Applied Leave', $1, $2, $3)`,
        [application.id, employeeId, JSON.stringify(application)]
      );

      await client.query('COMMIT');

      // Optional email alert
      const adminEmail = process.env.EMAIL_USER || 'admin@isoftzone.com';
      await sendEmail({
        to: adminEmail,
        subject: `New Leave Request: ${employeeName} - ${leaveName}`,
        text: `${employeeName} has applied for ${totalDays} days of ${leaveName} starting from ${fromDate} to ${toDate}.\nReason: ${reason || 'Not specified'}`
      });

      return application;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateLeaveStatus(leaveId, { status, remarks }, currentUser) {
    if (status !== 'Approved' && status !== 'Rejected') {
      throw new BadRequestError('Status must be Approved or Rejected');
    }

    const client = await pool.connect();
    let leaveApplication = null;
    try {
      await client.query('BEGIN');

      leaveApplication = await leaveRepository.findById(leaveId, client);
      if (!leaveApplication) {
        throw new NotFoundError('Leave application not found');
      }

      if (leaveApplication.status !== 'Pending') {
        throw new BadRequestError(`Leave application has already been processed (current status: ${leaveApplication.status})`);
      }

      // If approved, deduct from leave balance
      if (status === 'Approved') {
        const availableBalance = await leaveRepository.findBalanceForEmployee(
          leaveApplication.employee_id,
          leaveApplication.leave_type_id,
          client
        );
        
        // Only deduct if employee has a record in leave_balance
        if (availableBalance !== null) {
          if (availableBalance < leaveApplication.total_days) {
            throw new BadRequestError(`Insufficient leave balance. Available: ${availableBalance} days, Required: ${leaveApplication.total_days} days`);
          }
          const newBalance = availableBalance - leaveApplication.total_days;
          await leaveRepository.updateBalance(
            leaveApplication.employee_id,
            leaveApplication.leave_type_id,
            newBalance,
            client
          );
        } else {
          logger.warn(`No leave balance found for Employee ID ${leaveApplication.employee_id}, Leave Type ID ${leaveApplication.leave_type_id}. Skipping balance deduction.`);
        }
      }

      // Update Leave status
      const updated = await leaveRepository.updateStatus(leaveId, status, client);

      // Record in approval history
      await leaveRepository.addApprovalHistory({
        leaveId,
        approvedBy: currentUser.id,
        action: status,
        remarks
      }, client);

      // Insert Notification for employee
      await client.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
        [leaveApplication.employee_id, `Leave ${status}`, `Your leave application has been ${status.toLowerCase()}`]
      );

      // Insert Audit log
      await client.query(
        `INSERT INTO audit_logs (table_name, action_type, record_id, performed_by, new_data) 
         VALUES ('Leave', $1, $2, $3, $4)`,
        [`${status} Leave`, leaveId, currentUser.id, JSON.stringify({ status, remarks })]
      );

      await client.query('COMMIT');
      logger.info(`Leave ID ${leaveId} updated to ${status} by User ID ${currentUser.id}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error in updateLeaveStatus transaction: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }

    // Send email outside the transaction to avoid holding database locks
    if (leaveApplication && leaveApplication.employee_email) {
      await sendEmail({
        to: leaveApplication.employee_email,
        subject: `Leave Application ${status}`,
        text: `Hello ${leaveApplication.employee_name},\n\nYour application for ${leaveApplication.leave_name} from ${leaveApplication.from_date} to ${leaveApplication.to_date} has been ${status.toLowerCase()}.\nRemarks: ${remarks || 'None'}\n\nBest regards,\nHR Team`
      });
    }

    return leaveApplication;
  }
}

module.exports = new LeaveService();
