const express = require('express');
const payrollController = require('../controllers/payrollController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);
router.get('/', payrollController.getPayroll);

module.exports = router;
