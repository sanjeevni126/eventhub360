const express = require('express');
const employeeController = require('../controllers/employeeController');
const { authenticateToken } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { employeeSchema, createEmployeeSchema } = require('../validations/schemas');

const router = express.Router();

router.use(authenticateToken);

router.get('/', employeeController.getEmployees);
router.post('/', validationMiddleware(createEmployeeSchema), employeeController.createEmployee);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', validationMiddleware(employeeSchema), employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;

