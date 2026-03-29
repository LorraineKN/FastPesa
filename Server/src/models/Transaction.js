const { query } = require('../config/db');
const { generateId } = require('../utils/idGenerator');

class Transaction {
  static async create({ walletId, type, amount, fee, status, referenceCode, externalReference, description }) {
    const id = generateId();
    const sql = `
      INSERT INTO transactions (id, wallet_id, type, amount, fee, status, reference_code, external_reference, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *;
    `;
    const result = await query(sql, [id, walletId, type, amount, fee || 0, status, referenceCode, externalReference, description]);
    return result.rows[0];
  }

  static async updateStatus(id, status, externalReference = null) {
    const sql = `
      UPDATE transactions 
      SET status = $1, external_reference = COALESCE($2, external_reference), updated_at = NOW() 
      WHERE id = $3 
      RETURNING *;
    `;
    const result = await query(sql, [status, externalReference, id]);
    return result.rows[0];
  }

  static async findByWalletId(walletId, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM transactions 
      WHERE wallet_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3;
    `;
    const result = await query(sql, [walletId, limit, offset]);
    return result.rows;
  }
}

module.exports = Transaction;