const express = require('express');
const { supabaseAuthMiddleware } = require('../controllers/supabaseAuthMiddleware');
const { pool } = require('../config/db');
const logger = require('../utils/logger');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const walletSnapshotSchema = Joi.object({
  p_user_id: Joi.string().uuid().required()
});

const ensureDemoWalletSchema = Joi.object({
  p_user_id: Joi.string().uuid().required(),
  p_full_name: Joi.string().optional(),
  p_email: Joi.string().email().optional(),
  p_username: Joi.string().optional(),
  p_account_type: Joi.string().valid('personal', 'business').default('personal')
});

const processDepositSchema = Joi.object({
  p_user_id: Joi.string().uuid().required(),
  p_amount: Joi.number().positive().required(),
  p_description: Joi.string().optional()
});

const processWithdrawalSchema = Joi.object({
  p_user_id: Joi.string().uuid().required(),
  p_amount: Joi.number().positive().required(),
  p_phone_number: Joi.string().optional(),
  p_description: Joi.string().optional()
});

const processWalletTransferSchema = Joi.object({
  p_sender_user_id: Joi.string().uuid().required(),
  p_receiver_wallet_id: Joi.string().uuid().required(),
  p_amount: Joi.number().positive().required(),
  p_description: Joi.string().optional()
});

const processMpesaTransactionSchema = Joi.object({
  p_user_id: Joi.string().uuid().required(),
  p_amount: Joi.number().positive().required(),
  p_type: Joi.string().valid('mpesa_paybill', 'mpesa_send_money', 'mpesa_buy_goods').required(),
  p_phone_number: Joi.string().optional(),
  p_paybill_number: Joi.string().optional(),
  p_account_number: Joi.string().optional(),
  p_till_number: Joi.string().optional()
});

/**
 * RPC endpoint: get_wallet_snapshot
 */
router.post('/rpc/get_wallet_snapshot', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { error, value } = walletSnapshotSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Ensure user can only access their own wallet
    if (value.p_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('SELECT * FROM get_wallet_snapshot($1)', [value.p_user_id]);
    res.json(result.rows[0].get_wallet_snapshot);
  } catch (error) {
    logger.error('get_wallet_snapshot error:', error);
    res.status(500).json({ error: 'Failed to get wallet snapshot' });
  }
});

/**
 * RPC endpoint: ensure_demo_wallet
 */
router.post('/rpc/ensure_demo_wallet', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { error, value } = ensureDemoWalletSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Ensure user can only create their own wallet
    if (value.p_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('SELECT * FROM ensure_demo_wallet($1, $2, $3, $4, $5)', [
      value.p_user_id,
      value.p_full_name,
      value.p_email,
      value.p_username,
      value.p_account_type
    ]);
    res.json(result.rows[0].ensure_demo_wallet);
  } catch (error) {
    logger.error('ensure_demo_wallet error:', error);
    res.status(500).json({ error: 'Failed to ensure demo wallet' });
  }
});

/**
 * RPC endpoint: process_deposit
 */
router.post('/rpc/process_deposit', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { error, value } = processDepositSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Ensure user can only deposit to their own wallet
    if (value.p_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('SELECT * FROM process_deposit($1, $2, $3)', [
      value.p_user_id,
      value.p_amount,
      value.p_description
    ]);
    res.json(result.rows[0].process_deposit);
  } catch (error) {
    logger.error('process_deposit error:', error);
    res.status(500).json({ error: 'Failed to process deposit' });
  }
});

/**
 * RPC endpoint: process_withdrawal
 */
router.post('/rpc/process_withdrawal', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { error, value } = processWithdrawalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Ensure user can only withdraw from their own wallet
    if (value.p_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('SELECT * FROM process_withdrawal($1, $2, $3, $4)', [
      value.p_user_id,
      value.p_amount,
      value.p_phone_number,
      value.p_description
    ]);
    res.json(result.rows[0].process_withdrawal);
  } catch (error) {
    logger.error('process_withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

/**
 * RPC endpoint: process_wallet_transfer
 */
router.post('/rpc/process_wallet_transfer', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { error, value } = processWalletTransferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Ensure user can only transfer from their own wallet
    if (value.p_sender_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('SELECT * FROM process_wallet_transfer($1, $2, $3)', [
      value.p_sender_user_id,
      value.p_receiver_wallet_id,
      value.p_amount
    ]);
    res.json(result.rows[0].process_wallet_transfer);
  } catch (error) {
    logger.error('process_wallet_transfer error:', error);
    res.status(500).json({ error: 'Failed to process wallet transfer' });
  }
});

/**
 * RPC endpoint: process_mpesa_transaction
 */
router.post('/rpc/process_mpesa_transaction', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { error, value } = processMpesaTransactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Ensure user can only transact from their own wallet
    if (value.p_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('SELECT * FROM process_mpesa_transaction($1, $2, $3, $4, $5, $6, $7)', [
      value.p_user_id,
      value.p_amount,
      value.p_type,
      value.p_phone_number,
      value.p_paybill_number,
      value.p_account_number,
      value.p_till_number
    ]);
    res.json(result.rows[0].process_mpesa_transaction);
  } catch (error) {
    logger.error('process_mpesa_transaction error:', error);
    res.status(500).json({ error: 'Failed to process M-Pesa transaction' });
  }
});

/**
 * REST endpoint: Get transactions for a user
 */
router.get('/transactions', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const transactionsQuery = await pool.query(
      `SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    res.json({
      data: transactionsQuery.rows,
      count: transactionsQuery.rowCount
    });
  } catch (error) {
    logger.error('get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

/**
 * REST endpoint: Get user profile
 */
router.get('/profile', supabaseAuthMiddleware, async (req, res) => {
  try {
    const profileQuery = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profileQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ data: profileQuery.rows[0] });
  } catch (error) {
    logger.error('get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * REST endpoint: Get profiles (Supabase-style)
 */
router.get('/profiles', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { select = '*', user_id, username } = req.query;
    
    logger.info('Profiles endpoint called:', { user_id, username, select });
    
    let query = 'SELECT * FROM profiles';
    const params = [];
    let paramIndex = 1;
    
    if (user_id) {
      query += ` WHERE user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }
    
    if (username) {
      query += user_id ? ` AND username = $${paramIndex}` : ` WHERE username = $${paramIndex}`;
      params.push(username);
      paramIndex++;
    }
    
    logger.info('Executing query:', { query, params });
    const profileQuery = await pool.query(query, params);
    logger.info('Query result:', { rowCount: profileQuery.rowCount });
    
    // Return in Supabase format
    res.json(profileQuery.rows);
  } catch (error) {
    logger.error('get profiles error:', error);
    res.status(500).json({ error: 'Failed to get profiles' });
  }
});

/**
 * REST endpoint: Update profiles (Supabase-style)
 */
router.patch('/profiles', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { user_id } = req.query;
    const updateData = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required in query params' });
    }
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    // Build dynamic update query
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        params.push(updateData[key]);
        paramIndex++;
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    let query = `UPDATE profiles SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex} RETURNING *`;
    params.push(user_id);
    
    const updateQuery = await pool.query(query, params);

    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(updateQuery.rows[0]);
  } catch (error) {
    logger.error('update profiles error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * REST endpoint: Get wallets (Supabase-style)
 */
router.get('/wallets', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { select = '*', user_id } = req.query;
    
    let query = `SELECT ${select} FROM wallets`;
    const params = [];
    let paramIndex = 1;
    
    if (user_id) {
      query += ` WHERE user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }
    
    const walletQuery = await pool.query(query, params);
    
    // Return in Supabase format
    res.json(walletQuery.rows);
  } catch (error) {
    logger.error('get wallets error:', error);
    res.status(500).json({ error: 'Failed to get wallets' });
  }
});

/**
 * REST endpoint: Get transactions (Supabase-style)
 */
router.get('/transactions', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { select = '*', user_id, limit = '10', offset = '0' } = req.query;
    
    let query = `SELECT ${select} FROM transactions`;
    const params = [];
    let paramIndex = 1;
    
    if (user_id) {
      query += ` WHERE user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const transactionsQuery = await pool.query(query, params);
    const countQuery = await pool.query('SELECT COUNT(*) FROM transactions' + (user_id ? ` WHERE user_id = $1` : ''), user_id ? [user_id] : []);

    res.json({
      data: transactionsQuery.rows,
      count: parseInt(countQuery.rows[0].count)
    });
  } catch (error) {
    logger.error('get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

/**
 * REST endpoint: Get notifications (Supabase-style)
 */
router.get('/notifications', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { select = '*', user_id, is_read } = req.query;
    
    logger.info('Notifications endpoint called:', { user_id, is_read, select });
    
    let query = `SELECT ${select} FROM notifications`;
    const params = [];
    let paramIndex = 1;
    
    if (user_id) {
      query += ` WHERE user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }
    
    if (is_read !== undefined) {
      query += user_id ? ` AND is_read = $${paramIndex}` : ` WHERE is_read = $${paramIndex}`;
      params.push(is_read === 'true');
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    logger.info('Executing notifications query:', { query, params });
    const notificationsQuery = await pool.query(query, params);
    logger.info('Notifications query result:', { rowCount: notificationsQuery.rowCount });

    res.json(notificationsQuery.rows);
  } catch (error) {
    logger.error('get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

/**
 * REST endpoint: Update notifications (Supabase-style)
 */
router.patch('/notifications', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { user_id, is_read } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    const updateQuery = await pool.query(
      'UPDATE notifications SET is_read = $1 WHERE user_id = $2 RETURNING *',
      [is_read === 'true', user_id]
    );

    res.json(updateQuery.rows);
  } catch (error) {
    logger.error('update notifications error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

/**
 * REST endpoint: Update user profile
 */
router.put('/profile', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { full_name, username, phone } = req.body;
    
    const updateQuery = await pool.query(
      `UPDATE profiles 
       SET full_name = COALESCE($1, full_name),
           username = COALESCE($2, username),
           phone = COALESCE($3, phone),
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [full_name, username, phone, req.user.id]
    );

    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ data: updateQuery.rows[0] });
  } catch (error) {
    logger.error('update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * RPC endpoint: Process wallet transfer
 */
router.post('/rpc/process_transfer', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { error, value } = processWalletTransferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Ensure user can only transfer from their own wallet
    if (value.p_sender_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('SELECT * FROM process_transfer($1, $2, $3, $4)', [
      value.p_sender_user_id,
      value.p_receiver_wallet_id,
      value.p_amount,
      value.p_description || 'Wallet transfer'
    ]);
    res.json(result.rows[0].process_transfer);
  } catch (error) {
    logger.error('process_transfer error:', error);
    res.status(500).json({ error: 'Failed to process transfer' });
  }
});

module.exports = router;
