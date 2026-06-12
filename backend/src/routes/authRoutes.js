const express = require('express');
const authController = require('../controllers/authController');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { signupSchema, loginSchema } = require('../validations/schemas');

const router = express.Router();

router.post('/signup', validationMiddleware(signupSchema), authController.signup);
router.post('/login', validationMiddleware(loginSchema), authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
