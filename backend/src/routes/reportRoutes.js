const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/employees', reportController.getEmployeeReport);
router.get('/leaves', reportController.getLeaveReport);
router.get('/assets', reportController.getAssetReport);

module.exports = router;
