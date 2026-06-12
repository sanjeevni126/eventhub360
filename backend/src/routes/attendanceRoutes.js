const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticateToken); // Protect all routes

router.get('/', attendanceController.getAttendance);
router.get('/today', attendanceController.getTodayStatus);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

module.exports = router;
