const logger = require('../utils/logger');
const { Pool } = require('pg');

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/emergency_wallet'
});

class ProfileService {
  /**
   * Get user profile by user ID
   */
  async getProfile(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM profiles WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const profile = result.rows[0];

      // Get user roles
      const rolesResult = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [userId]
      );

      const roles = rolesResult.rows.map(row => row.role);

      return {
        ...profile,
        roles
      };
    } catch (error) {
      logger.error('getProfile error:', error);
      throw error;
    }
  }

  /**
   * Create or update user profile
   */
  async upsertProfile(userId, profileData) {
    try {
      const { email, fullName, username, phone, accountType, businessName } = profileData;

      const result = await pool.query(
        `INSERT INTO profiles (user_id, email, full_name, username, phone, account_type, business_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           email = EXCLUDED.email,
           full_name = EXCLUDED.full_name,
           username = EXCLUDED.username,
           phone = EXCLUDED.phone,
           account_type = EXCLUDED.account_type,
           business_name = EXCLUDED.business_name,
           updated_at = NOW()
         RETURNING *`,
        [userId, email, fullName, username, phone, accountType, businessName]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('upsertProfile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    try {
      const allowedFields = ['full_name', 'username', 'phone', 'business_name'];
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(userId);

      const query = `
        UPDATE profiles 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, updateValues);

      if (result.rows.length === 0) {
        throw new Error('Profile not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('updateProfile error:', error);
      throw error;
    }
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username, excludeUserId = null) {
    try {
      let query = 'SELECT COUNT(*) as count FROM profiles WHERE username = $1';
      const params = [username];

      if (excludeUserId) {
        query += ' AND user_id != $2';
        params.push(excludeUserId);
      }

      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count) === 0;
    } catch (error) {
      logger.error('isUsernameAvailable error:', error);
      throw error;
    }
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(username) {
    try {
      const result = await pool.query(
        'SELECT * FROM profiles WHERE username = $1',
        [username.toLowerCase()]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('getProfileByUsername error:', error);
      throw error;
    }
  }

  /**
   * Search profiles by name or username
   */
  async searchProfiles(query, limit = 10) {
    try {
      const searchPattern = `%${query}%`;
      const result = await pool.query(
        `SELECT user_id, full_name, username, email 
         FROM profiles 
         WHERE full_name ILIKE $1 OR username ILIKE $1
         LIMIT $2`,
        [searchPattern, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('searchProfiles error:', error);
      throw error;
    }
  }

  /**
   * Add user role
   */
  async addUserRole(userId, role) {
    try {
      const validRoles = ['admin', 'user', 'business'];
      if (!validRoles.includes(role)) {
        throw new Error('Invalid role');
      }

      const result = await pool.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
        [userId, role]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('addUserRole error:', error);
      throw error;
    }
  }

  /**
   * Remove user role
   */
  async removeUserRole(userId, role) {
    try {
      const result = await pool.query(
        'DELETE FROM user_roles WHERE user_id = $1 AND role = $2 RETURNING *',
        [userId, role]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('removeUserRole error:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error('getUserNotifications error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId, userId) {
    try {
      const result = await pool.query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [notificationId, userId]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('markNotificationAsRead error:', error);
      throw error;
    }
  }

  /**
   * Create notification
   */
  async createNotification(userId, title, message, type = 'info', reference = null) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, title, message, type, reference]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('createNotification error:', error);
      throw error;
    }
  }

  /**
   * Delete user account and related data
   */
  async deleteUserAccount(userId) {
    try {
      await pool.query('BEGIN');

      // Delete notifications
      await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

      // Delete user roles
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);

      // Delete payment requests
      await pool.query('DELETE FROM payment_requests WHERE user_id = $1', [userId]);

      // Delete transactions (will cascade to wallet)
      await pool.query('DELETE FROM transactions WHERE user_id = $1', [userId]);

      // Delete wallet
      await pool.query('DELETE FROM wallets WHERE user_id = $1', [userId]);

      // Delete profile
      await pool.query('DELETE FROM profiles WHERE user_id = $1', [userId]);

      await pool.query('COMMIT');

      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      logger.error('deleteUserAccount error:', error);
      throw error;
    }
  }
}

module.exports = new ProfileService();
