const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  async getNotifications(userId) {
    return await notificationRepository.getByUser(userId);
  }

  async markAsRead(notificationId) {
    await notificationRepository.markAsRead(notificationId);
    return { success: true };
  }
}

module.exports = new NotificationService();
