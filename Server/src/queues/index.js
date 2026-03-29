const { paymentQueue } = require('./paymentQueue');
const { notificationQueue } = require('./notificationQueue');
const startWorkers = async () => {
  require('../workers/paymentWorker');
  require('../workers/notificationWorker');
  console.log('Workers started');
};

module.exports = { startWorkers, paymentQueue, notificationQueue };