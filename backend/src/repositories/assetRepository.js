const db = require('../config/db');

class AssetRepository {
  async findAll({ limit, offset, status, search, category, assigned_employee }) {
    let query = `
      SELECT a.*, u.name as assigned_to, u.id as assigned_to_id
      FROM assets a
      LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.status = 'Active'
      LEFT JOIN users u ON aa.employee_id = u.id
      WHERE 1=1
    `;
    let params = [];
    
    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    
    if (category) {
      params.push(category);
      query += ` AND a.asset_type ILIKE $${params.length}`;
    }

    if (assigned_employee) {
      if (!isNaN(assigned_employee)) {
        params.push(parseInt(assigned_employee, 10));
        query += ` AND aa.employee_id = $${params.length}`;
      } else {
        params.push(`%${assigned_employee}%`);
        query += ` AND u.name ILIKE $${params.length}`;
      }
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (a.asset_name ILIKE $${params.length} OR a.asset_code ILIKE $${params.length})`;
    }
    
    query += ` ORDER BY a.id ASC`;

    if (limit !== undefined && offset !== undefined) {
      params.push(parseInt(limit, 10), parseInt(offset, 10));
      query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
      FROM assets a
      LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.status = 'Active'
      LEFT JOIN users u ON aa.employee_id = u.id
      WHERE 1=1
    `;
    let countParams = [];
    
    if (status) {
      countParams.push(status);
      countQuery += ` AND a.status = $${countParams.length}`;
    }
    if (category) {
      countParams.push(category);
      countQuery += ` AND a.asset_type ILIKE $${countParams.length}`;
    }
    if (assigned_employee) {
      if (!isNaN(assigned_employee)) {
        countParams.push(parseInt(assigned_employee, 10));
        countQuery += ` AND aa.employee_id = $${countParams.length}`;
      } else {
        countParams.push(`%${assigned_employee}%`);
        countQuery += ` AND u.name ILIKE $${countParams.length}`;
      }
    }
    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (a.asset_name ILIKE $${countParams.length} OR a.asset_code ILIKE $${countParams.length})`;
    }
    
    const countResult = await db.query(countQuery, countParams);
    
    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10)
    };
  }

  async findById(id, client = db) {
    const result = await client.query('SELECT * FROM assets WHERE id = $1', [id]);
    return result.rows[0];
  }

  async create(assetData, client = db) {
    const { asset_code, asset_name, asset_type, purchase_date, purchase_cost } = assetData;
    const result = await client.query(
      `INSERT INTO assets (asset_code, asset_name, asset_type, purchase_date, purchase_cost, status) 
       VALUES ($1, $2, $3, $4, $5, 'Available') RETURNING *`,
      [asset_code, asset_name, asset_type, purchase_date || null, purchase_cost || null]
    );
    return result.rows[0];
  }

  async updateStatus(id, status, client = db) {
    const result = await client.query(
      'UPDATE assets SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  async allocate(assetId, employeeId, allocatedBy, client = db) {
    const result = await client.query(
      `INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, allocated_date, status) 
       VALUES ($1, $2, $3, CURRENT_DATE, 'Active') RETURNING *`,
      [assetId, employeeId, allocatedBy]
    );
    return result.rows[0];
  }

  async returnAssetByAssetId(assetId, client = db) {
    const result = await client.query(
      `UPDATE asset_allocations SET status = 'Returned', return_date = CURRENT_DATE 
       WHERE asset_id = $1 AND status = 'Active' RETURNING *`,
      [assetId]
    );
    return result.rows[0];
  }

  async addHistory(assetId, action, remarks, createdBy, client = db) {
    await client.query(
      `INSERT INTO asset_history (asset_id, action, remarks, created_by) 
       VALUES ($1, $2, $3, $4)`,
      [assetId, action, remarks, createdBy]
    );
  }
  
  async getHistory(assetId) {
    const result = await db.query(
      `SELECT ah.*, u.name as created_by_name 
       FROM asset_history ah
       LEFT JOIN users u ON ah.created_by = u.id
       WHERE ah.asset_id = $1 ORDER BY ah.created_at DESC`,
      [assetId]
    );
    return result.rows;
  }
}

module.exports = new AssetRepository();
