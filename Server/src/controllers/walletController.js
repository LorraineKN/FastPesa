const walletService = require('../services/walletService');
const paymentService = require('../services/paymentService');

exports.getWallet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wallet = await walletService.getBalance(userId);
    res.json(wallet);
  } catch (error) {
    next(error);
  }
};

exports.mockCallback = async (req, res, next) => {
  try {
    const { transactionId, status } = req.body;
    const logger = require('../utils/logger');
    const transactionService = require('../services/transactionService');
    const walletService = require('../services/walletService');
    
    logger.info(`Mock callback: ${transactionId} -> ${status}`);
    
    // Find the transaction
    const transaction = await transactionService.getTransactionById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction already processed' });
    }
    
    // Update transaction status
    await transactionService.updateTransactionStatus(transactionId, status);
    
    // If successful, update the wallet balance
    if (status === 'success' && transaction.type === 'deposit') {
      await walletService.completeRecharge(transaction.wallet_id, parseFloat(transaction.amount));
    }
    
    res.json({ success: true, message: `Transaction ${transactionId} marked as ${status}` });
  } catch (error) {
    next(error);
  }
};

exports.recharge = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, phoneNumber } = req.body;
    const ipAddress = req.ip;
    
    // Normalize phone number by removing + sign if present
    const normalizedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber.substring(1) 
      : phoneNumber;
    
    const result = await paymentService.initiateRecharge(userId, amount, normalizedPhone, ipAddress);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
