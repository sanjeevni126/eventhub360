const { pool } = require('../config/db');
const assetRepository = require('../repositories/assetRepository');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

class AssetService {
  async getAllAssets(query) {
    const limit = query.limit !== undefined ? parseInt(query.limit, 10) : undefined;
    const offset = query.offset !== undefined ? parseInt(query.offset, 10) : undefined;
    return await assetRepository.findAll({
      limit,
      offset,
      status: query.status,
      search: query.search,
      category: query.category,
      assigned_employee: query.assigned_employee
    });
  }

  async getAssetById(id) {
    const asset = await assetRepository.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }
    return asset;
  }

  async createAsset(assetData, currentUser) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const asset = await assetRepository.create(assetData, client);
      
      // Audit log
      await client.query(
        `INSERT INTO audit_logs (table_name, action_type, record_id, performed_by, new_data) 
         VALUES ('assets', 'CREATE', $1, $2, $3)`,
        [asset.id, currentUser.id, JSON.stringify(asset)]
      );
      
      // History
      await assetRepository.addHistory(asset.id, 'Created', 'Asset registered into system', currentUser.id, client);

      await client.query('COMMIT');
      logger.info(`Asset ID ${asset.id} registered successfully by User ID ${currentUser.id}`);
      return asset;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error creating asset: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async allocateAsset(assetId, employeeId, currentUser) {
    const client = await pool.connect();
    let allocation = null;
    let employee = null;
    let asset = null;
    try {
      await client.query('BEGIN');

      asset = await assetRepository.findById(assetId, client);
      if (!asset) {
        throw new NotFoundError('Asset not found');
      }
      if (asset.status !== 'Available') {
        throw new BadRequestError('Asset is not available for allocation');
      }

      // Fetch employee email
      const userRes = await client.query('SELECT name, email FROM users WHERE id = $1', [employeeId]);
      if (userRes.rows.length === 0) {
        throw new NotFoundError('Employee not found');
      }
      employee = userRes.rows[0];

      // Allocate
      allocation = await assetRepository.allocate(assetId, employeeId, currentUser.id, client);
      
      // Update status
      await assetRepository.updateStatus(assetId, 'Allocated', client);

      // History
      await assetRepository.addHistory(assetId, 'Assigned', `Assigned to employee ID: ${employeeId} (${employee.name})`, currentUser.id, client);

      // Notification
      await client.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
        [employeeId, 'Asset Assigned', `You have been assigned a new asset: ${asset.asset_name} (${asset.asset_code})`]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (table_name, action_type, record_id, performed_by, new_data) 
         VALUES ('asset_allocations', 'CREATE', $1, $2, $3)`,
        [allocation.id, currentUser.id, JSON.stringify(allocation)]
      );

      await client.query('COMMIT');
      logger.info(`Asset ID ${assetId} allocated to employee ID ${employeeId} by User ID ${currentUser.id}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error in allocateAsset transaction: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }

    // Send email outside the transaction
    if (employee && employee.email && asset) {
      await sendEmail({
        to: employee.email,
        subject: 'HRMS Asset Assigned',
        text: `Hello ${employee.name},\n\nYou have been assigned the following asset:\nAsset Name: ${asset.asset_name}\nAsset Code: ${asset.asset_code}\nAsset Type: ${asset.asset_type}\n\nPlease verify and acknowledge receipt.\n\nBest regards,\nIT Support Team`
      });
    }

    return allocation;
  }

  async returnAsset(assetId, currentUser) {
    const client = await pool.connect();
    let allocation = null;
    try {
      await client.query('BEGIN');

      allocation = await client.query(
        `SELECT * FROM asset_allocations WHERE asset_id = $1 AND status = 'Active'`,
        [assetId]
      );
      if (allocation.rows.length === 0) {
        throw new BadRequestError('Asset is not currently allocated');
      }
      const activeAllocation = allocation.rows[0];

      // Mark allocation as returned
      const updatedAllocation = await assetRepository.returnAssetByAssetId(assetId, client);
      
      // Update asset status
      await assetRepository.updateStatus(assetId, 'Available', client);
      
      // History
      await assetRepository.addHistory(assetId, 'Returned', 'Asset returned to inventory', currentUser.id, client);
      
      // Audit log
      await client.query(
        `INSERT INTO audit_logs (table_name, action_type, record_id, performed_by, new_data) 
         VALUES ('asset_allocations', 'UPDATE', $1, $2, $3)`,
        [activeAllocation.id, currentUser.id, JSON.stringify(updatedAllocation)]
      );

      await client.query('COMMIT');
      logger.info(`Asset ID ${assetId} returned successfully by User ID ${currentUser.id}`);
      return updatedAllocation;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error in returnAsset transaction: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getAssetHistory(assetId) {
    return await assetRepository.getHistory(assetId);
  }
}

module.exports = new AssetService();
