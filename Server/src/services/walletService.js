const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { getRedis } = require('../config/redis');
const env = require('../config/env');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const { Pool } = require('pg');

// Database pool for direct queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/emergency_wallet'
});

class WalletService {
  async getBalance(userId) {
    // Try new schema first
    try {
      const result = await pool.query(
        'SELECT * FROM wallets WHERE user_id = $1',
        [userId]
      );
      
      if (result.rows.length > 0) {
        const wallet = result.rows[0];
        return { 
          id: wallet.id,
          balance: parseFloat(wallet.balance), 
          currency: wallet.currency || 'KES',
          wallet_name: wallet.wallet_name || 'FastPesa Wallet',
          is_active: wallet.is_active,
          is_demo_funded: wallet.is_demo_funded,
          dailyLimit: 100000, // Default limits for compatibility
          monthlyLimit: 1000000
        };
      }
    } catch (error) {
      logger.warn('New wallet schema query failed, trying legacy:', error.message);
    }

    // Fallback to legacy schema
    const wallet = await Wallet.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');
    return { 
      balance: parseFloat(wallet.balance), 
      dailyLimit: parseFloat(wallet.daily_limit), 
      monthlyLimit: parseFloat(wallet.monthly_limit) 
    };
  }

  async getWalletSnapshot(userId) {
    try {
      const result = await pool.query('SELECT * FROM get_wallet_snapshot($1)', [userId]);
      return result.rows[0].get_wallet_snapshot;
    } catch (error) {
      logger.error('getWalletSnapshot error:', error);
      throw error;
    }
  }

  async ensureDemoWallet(userId, fullName, email, username, accountType = 'personal') {
    try {
      const result = await pool.query('SELECT * FROM ensure_demo_wallet($1, $2, $3, $4, $5)', [
        userId, fullName, email, username, accountType
      ]);
      return result.rows[0].ensure_demo_wallet;
    } catch (error) {
      logger.error('ensureDemoWallet error:', error);
      throw error;
    }
  }

  async processDeposit(userId, amount, description = 'Wallet deposit') {
    try {
      const result = await pool.query('SELECT * FROM process_deposit($1, $2, $3)', [
        userId, amount, description
      ]);
      return result.rows[0].process_deposit;
    } catch (error) {
      logger.error('processDeposit error:', error);
      throw error;
    }
  }

  async processWithdrawal(userId, amount, phoneNumber = null, description = 'Wallet withdrawal') {
    try {
      const result = await pool.query('SELECT * FROM process_withdrawal($1, $2, $3, $4)', [
        userId, amount, phoneNumber, description
      ]);
      return result.rows[0].process_withdrawal;
    } catch (error) {
      logger.error('processWithdrawal error:', error);
      throw error;
    }
  }

  async processWalletTransfer(senderUserId, receiverWalletId, amount) {
    try {
      const result = await pool.query('SELECT * FROM process_wallet_transfer($1, $2, $3)', [
        senderUserId, receiverWalletId, amount
      ]);
      return result.rows[0].process_wallet_transfer;
    } catch (error) {
      logger.error('processWalletTransfer error:', error);
      throw error;
    }
  }

  async resolveWalletByUsername(username) {
    try {
      const cleanedUsername = username.trim().toLowerCase();
      
      const profileQuery = await pool.query(
        'SELECT user_id, full_name, username FROM profiles WHERE username = $1',
        [cleanedUsername]
      );

      if (profileQuery.rows.length === 0) {
        return null;
      }

      const profile = profileQuery.rows[0];

      const walletQuery = await pool.query(
        'SELECT id, user_id FROM wallets WHERE user_id = $1',
        [profile.user_id]
      );

      if (walletQuery.rows.length === 0) {
        return null;
      }

      const wallet = walletQuery.rows[0];

      return {
        walletId: wallet.id,
        userId: wallet.user_id,
        fullName: profile.full_name || profile.username || 'User'
      };
    } catch (error) {
      logger.error('resolveWalletByUsername error:', error);
      throw error;
    }
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

  async refundFailedPayment(userId, amount, originalTransactionId) {
    // Check if refund already processed
    const existingRefund = await Transaction.findByReferenceCode(`REFUND_${originalTransactionId}`);
    if (existingRefund) {
      logger.info(`Refund already processed for transaction ${originalTransactionId}`);
      return;
    }

    const wallet = await Wallet.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');

    // Refund money
    const newBalance = parseFloat(wallet.balance) + amount;
    await Wallet.updateBalance(wallet.id, newBalance);

    // Create a refund transaction
    await Transaction.create({
      walletId: wallet.id,
      type: 'refund',
      amount: amount,
      fee: 0,
      status: 'success',
      referenceCode: `REFUND_${originalTransactionId}`,
      description: `Refund for failed transaction ${originalTransactionId}`,
    });

    logger.info(`Refunded ${amount} to user ${userId} for failed transaction ${originalTransactionId}`);
  }

  async completeRecharge(walletId, amount) {
    // Add money to wallet for successful recharge
    const wallet = await Wallet.findById(walletId);
    if (!wallet) throw new Error('Wallet not found');
    
    const newBalance = parseFloat(wallet.balance) + amount;
    await Wallet.updateBalance(wallet.id, newBalance);
    
    logger.info(`Recharge completed: added ${amount} to wallet ${walletId}, new balance: ${newBalance}`);
  }

  async getUserWallet(userId) {
    return Wallet.findByUserId(userId);
  }
}

module.exports = new WalletService();