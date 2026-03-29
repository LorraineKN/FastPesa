const { query } = require('../config/db');
const { generateId } = require('../utils/idGenerator');

class AuditLog {
  static async log({ userId, action, metadata, ipAddress, deviceInfo }) {
    const id = generateId();
    const sql = `
      INSERT INTO audit_logs (id, user_id, action, metadata, ip_address, device_info, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW());
    `;
    await query(sql, [id, userId, action, JSON.stringify(metadata), ipAddress, deviceInfo]);
  }
}

module.exports = AuditLog;