const Transaction = require('../models/Transaction');
const { query } = require('../config/db');
const { Pool } = require('pg');
const logger = require('../utils/logger');

// Database pool for direct queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/emergency_wallet'
});

class TransactionService {
  async createTransaction({ walletId, type, amount, status, referenceCode, description, userId, metadata = {} }) {
    try {
      // Try new schema first
      if (userId) {
        const result = await pool.query(
          `INSERT INTO transactions 
           (user_id, wallet_id, type, amount, status, description, reference, 
            phone_number, paybill_number, account_number, till_number, mpesa_receipt,
            sender_wallet_id, receiver_wallet_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           RETURNING *`,
          [
            userId,
            walletId,
            type,
            amount,
            status,
            description,
            referenceCode,
            metadata.phone_number || null,
            metadata.paybill_number || null,
            metadata.account_number || null,
            metadata.till_number || null,
            metadata.mpesa_receipt || null,
            metadata.sender_wallet_id || null,
            metadata.receiver_wallet_id || null
          ]
        );
        return result.rows[0];
      }

      // Fallback to legacy schema
      return Transaction.create({ walletId, type, amount, fee: 0, status, referenceCode, description });
    } catch (error) {
      logger.error('createTransaction error:', error);
      throw error;
    }
  }

  async updateTransactionStatus(transactionId, status, externalReference = null) {
    try {
      // Try new schema first
      const result = await pool.query(
        'UPDATE transactions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, transactionId]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Fallback to legacy schema
      return Transaction.updateStatus(transactionId, status, externalReference);
    } catch (error) {
      logger.error('updateTransactionStatus error:', error);
      throw error;
    }
  }

  async getTransactionById(transactionId, userId = null) {
    try {
      // Try new schema first
      let sql = `SELECT * FROM transactions WHERE id = $1`;
      let params = [transactionId];
      
      if (userId) {
        sql += ` AND user_id = $2`;
        params.push(userId);
      }
      
      const result = await pool.query(sql, params);
      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Fallback to legacy schema
      let legacySql = `SELECT * FROM transactions WHERE id = $1`;
      let legacyParams = [transactionId];
      
      if (userId) {
        legacySql += ` AND wallet_id = (SELECT id FROM wallets WHERE user_id = $2)`;
        legacyParams.push(userId);
      }
      
      const legacyResult = await query(legacySql, legacyParams);
      return legacyResult.rows[0];
    } catch (error) {
      logger.error('getTransactionById error:', error);
      throw error;
    }
  }

  async getTransactions(userId, limit = 10, offset = 0, type = null) {
    try {
      // Try new schema first
      let sql = `SELECT * FROM transactions WHERE user_id = $1`;
      let params = [userId];
      
      if (type) {
        sql += ` AND type = $2`;
        params.push(type);
      }
      
      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const result = await pool.query(sql, params);
      if (result.rows.length > 0 || result.rowCount > 0) {
        return {
          transactions: result.rows,
          count: result.rowCount
        };
      }

      // Fallback to legacy schema
      const walletQuery = await pool.query('SELECT id FROM wallets WHERE user_id = $1', [userId]);
      if (walletQuery.rows.length > 0) {
        const walletId = walletQuery.rows[0].id;
        return {
          transactions: await Transaction.findByWalletId(walletId, limit, offset),
          count: await Transaction.countByWalletId(walletId)
        };
      }

      return { transactions: [], count: 0 };
    } catch (error) {
      logger.error('getTransactions error:', error);
      throw error;
    }
  }

  async getMpesaTransactions(userId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM transactions 
         WHERE user_id = $1 AND type LIKE 'mpesa_%'
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return {
        transactions: result.rows,
        count: result.rowCount
      };
    } catch (error) {
      logger.error('getMpesaTransactions error:', error);
      throw error;
    }
  }

  async getTransactionsByType(userId, transactionType, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM transactions 
         WHERE user_id = $1 AND type = $2
         ORDER BY created_at DESC 
         LIMIT $3 OFFSET $4`,
        [userId, transactionType, limit, offset]
      );

      return {
        transactions: result.rows,
        count: result.rowCount
      };
    } catch (error) {
      logger.error('getTransactionsByType error:', error);
      throw error;
    }
  }

  async findTransactionByReference(referenceCode, userId = null) {
    try {
      // Try new schema first
      let sql = `SELECT * FROM transactions WHERE reference = $1`;
      let params = [referenceCode];
      
      if (userId) {
        sql += ` AND user_id = $2`;
        params.push(userId);
      }
      
      const result = await pool.query(sql, params);
      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Fallback to legacy schema
      const legacySql = `SELECT * FROM transactions WHERE reference_code = $1`;
      const legacyResult = await query(legacySql, [referenceCode]);
      return legacyResult.rows[0];
    } catch (error) {
      logger.error('findTransactionByReference error:', error);
      throw error;
    }
  }

  async getTransactionStats(userId) {
    try {
      const result = await pool.query(
        `SELECT 
           type,
           COUNT(*) as count,
           COALESCE(SUM(amount), 0) as total_amount,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
           COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
         FROM transactions 
         WHERE user_id = $1 
         GROUP BY type`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error('getTransactionStats error:', error);
      throw error;
    }
  }

  async createPaymentRequest(userId, walletId, amount, description, expiresAt = null) {
    try {
      const result = await pool.query(
        `INSERT INTO payment_requests 
         (user_id, wallet_id, amount, description, status, expires_at)
         VALUES ($1, $2, $3, $4, 'pending', $5)
         RETURNING *`,
        [userId, walletId, amount, description, expiresAt]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('createPaymentRequest error:', error);
      throw error;
    }
  }

  async getPaymentRequests(userId, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM payment_requests 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return {
        paymentRequests: result.rows,
        count: result.rowCount
      };
    } catch (error) {
      logger.error('getPaymentRequests error:', error);
      throw error;
    }
  }
}

module.exports = new TransactionService();