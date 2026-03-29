const Bull = require('bull');
const { getRedis } = require('../config/redis');
const env = require('../config/env');

const paymentQueue = new Bull('payment', {
  redis: { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD },
});

const addPaymentJob = async (data) => {
  await paymentQueue.add(data, { attempts: 3, backoff: 5000 });
};

module.exports = { paymentQueue, addPaymentJob };