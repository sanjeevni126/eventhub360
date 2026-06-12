const express = require('express');
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', auditController.getAuditLogs);

module.exports = router;
