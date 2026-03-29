const transactionService = require('../services/transactionService');
const Wallet = require('../models/Wallet');

exports.getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    // Get user's wallet first
    const wallet = await Wallet.findByUserId(userId);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    const transactions = await transactionService.getTransactions(wallet.id, limit, offset);
    res.json(transactions);
  } catch (error) {
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
