const transactionService = require('../services/transactionService');

exports.getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    const transactions = await transactionService.getTransactionsByUserId(userId, limit, offset);
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
