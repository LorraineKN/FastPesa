const { query } = require('../config/db');
const { generateId } = require('../utils/idGenerator');

class Session {
  static async create({ userId, tokenHash, expiresAt, deviceInfo, ipAddress }) {
    const id = generateId();
    const sql = `
      INSERT INTO sessions (id, user_id, token_hash, expires_at, device_info, ip_address, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const result = await query(sql, [id, userId, tokenHash, expiresAt, deviceInfo, ipAddress]);
    return result.rows[0];
  }

  static async findByTokenHash(tokenHash) {
    const sql = `SELECT * FROM sessions WHERE token_hash = $1 AND expires_at > NOW()`;
    const result = await query(sql, [tokenHash]);
    return result.rows[0];
  }

  static async revokeAllForUser(userId) {
    const sql = `UPDATE sessions SET expires_at = NOW() WHERE user_id = $1 AND expires_at > NOW()`;
    await query(sql, [userId]);
  }
}

module.exports = Session;