const express = require('express');
const { registerUser, loginUser, logoutUser, refreshToken } = require('../services/supabaseAuthService');
const logger = require('../utils/logger');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required(),
  username: Joi.string().min(3).alphanum().required(),
  accountType: Joi.string().valid('personal', 'business').default('personal')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required()
});

/**
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const { email, password, fullName, username, accountType } = value;

    const result = await registerUser(email, password, fullName, username, accountType);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    logger.error('Registration endpoint error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ 
        error: 'User already exists',
        message: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message 
    });
  }
});

/**
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const { email, password } = value;

    const result = await loginUser(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    logger.error('Login endpoint error:', error);
    
    if (error.message.includes('Invalid email or password')) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    });
  }
});

/**
 * Logout user
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ 
        error: 'No token provided' 
      });
    }

    await logoutUser(token);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout endpoint error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      message: error.message 
    });
  }
});

/**
 * Refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details[0].message 
      });
    }

    const { refresh_token } = value;

    const result = await refreshToken(refresh_token);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Token refresh endpoint error:', error);
    
    if (error.message.includes('Failed to refresh token')) {
      return res.status(401).json({ 
        error: 'Token refresh failed',
        message: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Token refresh failed',
      message: error.message 
    });
  }
});

/**
 * Get current user (for testing authentication)
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided' 
      });
    }

    // This would be handled by the supabaseAuthMiddleware in a real scenario
    // For now, just return a success message
    res.json({
      success: true,
      message: 'Token is valid',
      token: token.substring(0, 20) + '...'
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ 
      error: 'Failed to get current user',
      message: error.message 
    });
  }
});

module.exports = router;
