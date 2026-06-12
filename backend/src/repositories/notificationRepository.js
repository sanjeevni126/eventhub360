const db = require('../config/db');

class NotificationRepository {
  async create(userId, title, message) {
    const query = `
      INSERT INTO notifications (user_id, title, message)
      VALUES ($1, $2, $3) RETURNING *
    `;
    const result = await db.query(query, [userId, title, message]);
    return result.rows[0];
  }

  async getByUser(userId) {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return result.rows;
  }

  async markAsRead(notificationId) {
    await db.query(`UPDATE notifications SET is_read = TRUE WHERE id = $1`, [notificationId]);
  }
}

module.exports = new NotificationRepository();
