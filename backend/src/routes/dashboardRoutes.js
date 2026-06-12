const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/stats', dashboardController.getStats);

module.exports = router;
