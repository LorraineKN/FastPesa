const { notificationQueue } = require('../queues/notificationQueue');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

notificationQueue.process(async (job) => {
  const { type, recipient, message, subject, userId } = job.data;
  logger.info(`Processing notification job: ${type} to ${recipient}`);
  
  try {
    let result;
    switch (type) {
      case 'sms':
        result = await notificationService.sendSMS(recipient, message);
        break;
      case 'email':
        result = await notificationService.sendEmail(recipient, subject, message);
        break;
      case 'push':
        result = await notificationService.sendPushNotification(userId, subject, message);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
    
    logger.info(`Notification sent successfully: ${result.messageId}`);
    return result;
  } catch (err) {
    logger.error(`Notification job failed: ${err.message}`);
    throw err;
  }
});