const { query } = require('../config/db');
const { generateId } = require('../utils/idGenerator');
const logger = require('../utils/logger');

class AuditLog {
  static async log({ userId, action, metadata = {}, ipAddress, deviceInfo }) {
    try {
      const id = generateId();
      const sql = `
        INSERT INTO audit_logs (id, user_id, action, metadata, ip_address, device_info, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW());
      `;
      await query(sql, [id, userId, action, JSON.stringify(metadata), ipAddress, deviceInfo]);
    } catch (error) {
      logger.error('Failed to log audit event', { 
        userId, 
        action, 
        error: error.message 
      });
    }
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    try {
      const sql = `
        SELECT * FROM audit_logs 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      const result = await query(sql, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to fetch audit logs', { 
        userId, 
        error: error.message 
      });
      throw new Error('Failed to fetch audit logs');
    }
  }
}

module.exports = AuditLog;