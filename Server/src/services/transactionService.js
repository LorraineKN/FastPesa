const Transaction = require('../models/Transaction');
const { query } = require('../config/db');

class TransactionService {
  async createTransaction({ walletId, type, amount, status, referenceCode, description }) {
    return Transaction.create({ walletId, type, amount, fee: 0, status, referenceCode, description });
  }

  async updateTransactionStatus(transactionId, status, externalReference = null) {
    return Transaction.updateStatus(transactionId, status, externalReference);
  }

  async getTransactionById(transactionId, userId = null) {
    let sql = `SELECT * FROM transactions WHERE id = $1`;
    let params = [transactionId];
    
    if (userId) {
      sql += ` AND wallet_id = (SELECT id FROM wallets WHERE user_id = $2)`;
      params.push(userId);
    }
    
    const result = await query(sql, params);
    return result.rows[0];
  }

  async getTransactions(walletId, limit, offset) {
    return Transaction.findByWalletId(walletId, limit, offset);
  }
}

module.exports = new TransactionService();