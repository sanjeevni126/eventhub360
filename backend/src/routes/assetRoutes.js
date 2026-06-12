const express = require('express');
const assetController = require('../controllers/assetController');
const { authenticateToken } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { assetSchema } = require('../validations/schemas');

const router = express.Router();

router.use(authenticateToken); // Protect all routes

router.get('/', assetController.getAssets);
router.post('/', validationMiddleware(assetSchema), assetController.createAsset);
router.post('/allocate', assetController.allocateAsset);
router.post('/:id/return', assetController.returnAsset);
router.get('/:id/history', assetController.getHistory);

module.exports = router;
