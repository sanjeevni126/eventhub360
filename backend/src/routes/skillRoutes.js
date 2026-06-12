const express = require('express');
const skillController = require('../controllers/skillController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', skillController.getSkills);

module.exports = router;
