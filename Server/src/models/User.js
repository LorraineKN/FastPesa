const { query } = require('../config/db');
const { hashPin, comparePin } = require('../utils/hash');
const { generateId } = require('../utils/idGenerator');

class User {
  static async create({ fullName, username, pin, phoneNumber }) {
    const id = generateId();
    const pinHash = await hashPin(pin);
    const sql = `
      INSERT INTO users (id, full_name, username, pin_hash, phone_number, status, failed_attempts, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'active', 0, NOW(), NOW())
      RETURNING id, full_name, username, phone_number, status, created_at;
    `;
    const result = await query(sql, [id, fullName, username, pinHash, phoneNumber]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const sql = `SELECT * FROM users WHERE username = $1`;
    const result = await query(sql, [username]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `SELECT id, full_name, username, phone_number, status, failed_attempts, last_login_at, created_at FROM users WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async updateFailedAttempts(id, attempts) {
    const sql = `UPDATE users SET failed_attempts = $1, updated_at = NOW() WHERE id = $2`;
    await query(sql, [attempts, id]);
  }

  static async lockAccount(id) {
    const sql = `UPDATE users SET status = 'locked', updated_at = NOW() WHERE id = $1`;
    await query(sql, [id]);
  }

  static async updateLastLogin(id) {
    const sql = `UPDATE users SET last_login_at = NOW(), failed_attempts = 0, updated_at = NOW() WHERE id = $1`;
    await query(sql, [id]);
  }
}

module.exports = User;