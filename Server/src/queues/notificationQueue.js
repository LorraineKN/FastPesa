const Bull = require('bull');
const { getRedis } = require('../config/redis');
const env = require('../config/env');

const notificationQueue = new Bull('notification', {
  redis: { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD },
});

const addNotificationJob = async (data) => {
  await notificationQueue.add(data, { attempts: 3, backoff: 5000 });
};

module.exports = { notificationQueue, addNotificationJob };
