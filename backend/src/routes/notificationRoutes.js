const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
