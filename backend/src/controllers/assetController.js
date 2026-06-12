const assetService = require('../services/assetService');

class AssetController {
  async getAssets(req, res, next) {
    try {
      const { limit, offset, status, search, category, assigned_employee } = req.query;
      const assets = await assetService.getAllAssets({ 
        limit, 
        offset, 
        status, 
        search, 
        category, 
        assigned_employee 
      });
      res.json(assets);
    } catch (error) {
      next(error);
    }
  }

  async createAsset(req, res, next) {
    try {
      const asset = await assetService.createAsset(req.body, req.user);
      res.status(201).json(asset);
    } catch (error) {
      next(error);
    }
  }

  async allocateAsset(req, res, next) {
    try {
      const { assetId, employeeId } = req.body;
      const allocation = await assetService.allocateAsset(assetId, employeeId, req.user);
      res.json(allocation);
    } catch (error) {
      next(error);
    }
  }

  async returnAsset(req, res, next) {
    try {
      const assetId = req.params.id;
      const allocation = await assetService.returnAsset(assetId, req.user);
      res.json(allocation);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const history = await assetService.getAssetHistory(req.params.id);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetController();
