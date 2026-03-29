const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { getRedis } = require('../config/redis');
const env = require('../config/env');
const AuditLog = require('../models/AuditLog');

class WalletService {
  async getBalance(userId) {
    const wallet = await Wallet.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');
    return { balance: parseFloat(wallet.balance), dailyLimit: wallet.daily_limit, monthlyLimit: wallet.monthly_limit };
  }

  async updateBalanceAtomic(userId, amountDelta, transactionType, description, ipAddress) {
    const wallet = await Wallet.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.is_locked) throw new Error('Wallet is locked');

    const newBalance = parseFloat(wallet.balance) + amountDelta;
    if (newBalance < 0) throw new Error('Insufficient funds');

    // Check daily/monthly limits for debit (negative delta)
    if (amountDelta < 0) {
      const today = new Date().toISOString().slice(0,10);
      const redis = getRedis();
      const dailyKey = `daily:${userId}:${today}`;
      const monthlyKey = `monthly:${userId}:${new Date().getMonth()}`;

      let dailySpent = parseFloat(await redis.get(dailyKey) || 0);
      let monthlySpent = parseFloat(await redis.get(monthlyKey) || 0);
      const debitAmount = -amountDelta;

      if (dailySpent + debitAmount > wallet.daily_limit) throw new Error('Daily limit exceeded');
      if (monthlySpent + debitAmount > wallet.monthly_limit) throw new Error('Monthly limit exceeded');

      await redis.incrbyfloat(dailyKey, debitAmount);
      await redis.expire(dailyKey, 86400);
      await redis.incrbyfloat(monthlyKey, debitAmount);
      await redis.expire(monthlyKey, 2592000);
    }

    const updatedWallet = await Wallet.updateBalance(wallet.id, newBalance);
    const transaction = await Transaction.create({
      walletId: wallet.id,
      type: transactionType,
      amount: Math.abs(amountDelta),
      fee: 0,
      status: 'success',
      referenceCode: `TXN_${Date.now()}`,
      description,
    });

    await AuditLog.log({ userId, action: 'BALANCE_UPDATE', metadata: { delta: amountDelta, newBalance }, ipAddress });
    return { balance: newBalance, transaction };
  }

  async getUserWallet(userId) {
    return Wallet.findByUserId(userId);
  }
}

module.exports = new WalletService();