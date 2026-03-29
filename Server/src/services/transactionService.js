const Transaction = require('../models/Transaction');

class TransactionService {
  async createTransaction({ walletId, type, amount, status, referenceCode, description }) {
    return Transaction.create({ walletId, type, amount, fee: 0, status, referenceCode, description });
  }

  async updateTransactionStatus(transactionId, status, externalReference = null) {
    return Transaction.updateStatus(transactionId, status, externalReference);
  }

  async getTransactions(walletId, limit, offset) {
    return Transaction.findByWalletId(walletId, limit, offset);
  }
}

module.exports = new TransactionService();