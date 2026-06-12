const cron = require('node-cron');
const db = require('../config/db');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const initCronJobs = () => {
  // 1. Daily leave reminder: runs at 9:00 AM every day
  // Cron expression: '0 9 * * *' (running every day at 9am)
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running Daily Leave Reminder Cron Job...');
    try {
      // Find all pending leave applications
      const result = await db.query(`
        SELECT la.id, u.name as employee_name, lt.leave_name, la.total_days
        FROM leave_applications la
        JOIN users u ON la.employee_id = u.id
        JOIN leave_types lt ON la.leave_type_id = lt.id
        WHERE la.status = 'Pending'
      `);
      
      const pendingCount = result.rows.length;
      logger.info(`Daily Leave Reminder Cron: Found ${pendingCount} pending leave applications.`);
      
      if (pendingCount > 0) {
        const adminEmail = process.env.EMAIL_USER || 'admin@isoftzone.com';
        const subject = `Daily Reminder: ${pendingCount} Pending Leave Applications Awaiting Review`;
        let html = `
          <h3>Daily Leave Reminder</h3>
          <p>There are currently ${pendingCount} leave applications awaiting approval:</p>
          <ul>
        `;
        
        result.rows.forEach(app => {
          html += `<li><strong>${app.employee_name}</strong> - ${app.leave_name} (${app.total_days} days)</li>`;
        });
        html += `
          </ul>
          <p>Please log in to the HRMS portal to review and approve/reject these applications.</p>
        `;
        
        await sendEmail({
          to: adminEmail,
          subject,
          html
        });
      }
    } catch (error) {
      logger.error(`Error in Daily Leave Reminder Cron: ${error.message}`);
    }
  });

  // 2. Monthly asset audit reminder: runs at 9:00 AM on the 1st of every month
  // Cron expression: '0 9 1 * *' (running on the 1st of every month at 9am)
  cron.schedule('0 9 1 * *', async () => {
    logger.info('Running Monthly Asset Audit Reminder Cron Job...');
    try {
      const adminEmail = process.env.EMAIL_USER || 'admin@isoftzone.com';
      const subject = `Monthly HRMS Asset Audit Reminder`;
      const html = `
        <h3>Monthly Asset Audit Reminder</h3>
        <p>Dear HR/Admin Team,</p>
        <p>This is a scheduled reminder to perform the monthly asset audit. Please verify the physical inventory against the HRMS records.</p>
        <p>Ensure that all allocated assets are correctly linked to their respective employees and returned assets are checked back into inventory.</p>
        <p>Thank you,</p>
        <p>HRMS Automated System</p>
      `;
      
      await sendEmail({
        to: adminEmail,
        subject,
        html
      });
    } catch (error) {
      logger.error(`Error in Monthly Asset Audit Cron: ${error.message}`);
    }
  });
  
  logger.info('Cron Jobs initialized successfully.');
};

module.exports = { initCronJobs };
