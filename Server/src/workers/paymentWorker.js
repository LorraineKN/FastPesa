const { paymentQueue } = require('../queues/paymentQueue');
const mpesaService = require('../services/mpesaService');
const transactionService = require('../services/transactionService');
const logger = require('../utils/logger');

paymentQueue.process(async (job) => {
  const { userId, phoneNumber, amount, transactionId } = job.data;
  logger.info(`Processing payment job for transaction ${transactionId}`);
  
  try {
    const result = await mpesaService.b2c(phoneNumber, amount, transactionId);
    if (result.ResponseCode === '0') {
      await transactionService.updateTransactionStatus(transactionId, 'success', result.ConversationID);
      logger.info(`Payment successful for transaction ${transactionId}`);
    } else {
      await transactionService.updateTransactionStatus(transactionId, 'failed');
      throw new Error('B2C failed');
    }
  } catch (err) {
    logger.error(`Payment job failed: ${err.message}`);
    await transactionService.updateTransactionStatus(transactionId, 'failed');
    throw err;
  }
});
