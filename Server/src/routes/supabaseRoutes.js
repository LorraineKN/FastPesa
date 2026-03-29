const express = require('express');
const { supabaseAuthMiddleware } = require('../controllers/supabaseAuthMiddleware');
const { Pool } = require('pg');
const logger = require('../utils/logger');
const Joi = require('joi');

const router = express.Router();

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/emergency_wallet'
});

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
  p_amount: Joi.number().positive().required()
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

module.exports = router;
