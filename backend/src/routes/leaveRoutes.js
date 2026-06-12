const express = require('express');
const leaveController = require('../controllers/leaveController');
const { authenticateToken } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { leaveSchema } = require('../validations/schemas');

const router = express.Router();

router.use(authenticateToken);

router.get('/', leaveController.getLeaves);
router.get('/types', leaveController.getLeaveTypes);
router.get('/balances', leaveController.getLeaveBalances);
router.post('/', validationMiddleware(leaveSchema), leaveController.applyLeave);
router.put('/:id/status', leaveController.updateLeaveStatus);

module.exports = router;
