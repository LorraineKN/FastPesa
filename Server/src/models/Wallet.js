const { query } = require('../config/db');
const env = require('../config/env');

class Wallet {
  static async create(userId) {
    const sql = `
      INSERT INTO wallets (id, user_id, balance, daily_limit, monthly_limit, is_locked, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 0, $2, $3, false, NOW(), NOW())
      RETURNING id, balance, daily_limit, monthly_limit;
    `;
    const result = await query(sql, [userId, env.DAILY_LIMIT, env.MONTHLY_LIMIT]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `SELECT * FROM wallets WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const sql = `SELECT * FROM wallets WHERE user_id = $1`;
    const result = await query(sql, [userId]);
    return result.rows[0];
  }

  static async updateBalance(walletId, newBalance) {
    const sql = `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await query(sql, [newBalance, walletId]);
    return result.rows[0];
  }

  static async lockWallet(walletId) {
    const sql = `UPDATE wallets SET is_locked = true WHERE id = $1`;
    await query(sql, [walletId]);
  }
}

module.exports = Wallet;