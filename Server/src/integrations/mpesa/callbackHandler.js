const transactionService = require('../../services/transactionService');
const walletService = require('../../services/walletService');
const logger = require('../../utils/logger');

class CallbackHandler {
  async handleSTKCallback(req, res) {
    try {
      const { Body } = req.body;
      const { stkCallback } = Body;
      
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
      
      if (ResultCode === 0) {
        // Success - credit the wallet
        const amount = CallbackMetadata.Item.find(item => item.Name === 'Amount')?.Value;
        const phoneNumber = CallbackMetadata.Item.find(item => item.Name === 'PhoneNumber')?.Value;
        
        // Find the pending transaction
        const transaction = await transactionService.findTransactionByReference(CheckoutRequestID);
        
        if (transaction) {
          await walletService.updateBalanceAtomic(
            transaction.wallet_id,
            amount,
            'deposit',
            `STK Push from ${phoneNumber}`,
            req.ip
          );
          
          await transactionService.updateTransactionStatus(transaction.id, 'success');
          logger.info(`STK callback successful: ${CheckoutRequestID}`);
        }
      } else {
        // Failed - update transaction status
        const transaction = await transactionService.findTransactionByReference(CheckoutRequestID);
        if (transaction) {
          await transactionService.updateTransactionStatus(transaction.id, 'failed');
          logger.error(`STK callback failed: ${CheckoutRequestID} - ${ResultDesc}`);
        }
      }
      
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
      logger.error('STK callback error:', error);
      res.status(500).json({ ResultCode: 1, ResultDesc: 'Server error' });
    }
  }

  async handleB2CCallback(req, res) {
    try {
      const { Result } = req.body;
      
      if (Result.ResultCode === 0) {
        // Success - transaction already marked as success by worker
        logger.info(`B2C callback successful: ${Result.ConversationID}`);
      } else {
        // Failed - update transaction status
        const transactionId = Result.ResultParameters?.ResultParameter?.find(
          param => param.Key === 'TransactionID'
        )?.Value;
        
        if (transactionId) {
          await transactionService.updateTransactionStatus(transactionId, 'failed');
          logger.error(`B2C callback failed: ${transactionId} - ${Result.ResultDesc}`);
        }
      }
      
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
      logger.error('B2C callback error:', error);
      res.status(500).json({ ResultCode: 1, ResultDesc: 'Server error' });
    }
  }
}

module.exports = new CallbackHandler();
