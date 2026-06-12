const express = require('express');

const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const departmentRoutes = require('./departmentRoutes');
const leaveRoutes = require('./leaveRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const skillRoutes = require('./skillRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const assetRoutes = require('./assetRoutes');
const notificationRoutes = require('./notificationRoutes');
const auditRoutes = require('./auditRoutes');
const reportRoutes = require('./reportRoutes');
const payrollRoutes = require('./payrollRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/leaves', leaveRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/skills', skillRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/assets', assetRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/reports', reportRoutes);
router.use('/payroll', payrollRoutes);

module.exports = router;
