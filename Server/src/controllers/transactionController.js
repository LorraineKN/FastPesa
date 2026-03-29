const transactionService = require('../services/transactionService');
const Wallet = require('../models/Wallet');
const logger = require('../utils/logger');

exports.getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    logger.info(`Fetching transactions for user: ${userId}`);
    
    // Get user's wallet first
    const wallet = await Wallet.findByUserId(userId);
    if (!wallet) {
      logger.error(`Wallet not found for user: ${userId}`);
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    logger.info(`Found wallet: ${wallet.id}`);
    const transactions = await transactionService.getTransactions(wallet.id, limit, offset);
    logger.info(`Found ${transactions.length} transactions`);
    
    res.json({ transactions });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    next(error);
  }
};

exports.getTransactionById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const transaction = await transactionService.getTransactionById(id, userId);
    res.json(transaction);
  } catch (error) {
    next(error);
  }
};
