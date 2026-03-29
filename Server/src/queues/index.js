const { paymentQueue } = require('./paymentQueue');
const startWorkers = async () => {
  require('../workers/paymentWorker');
  require('../workers/notificationWorker');
  console.log('Workers started');
};

module.exports = { startWorkers };