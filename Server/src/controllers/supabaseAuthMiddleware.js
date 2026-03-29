const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const { Pool } = require('pg');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database pool for direct queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/emergency_wallet'
});

/**
 * Middleware to verify Supabase JWT tokens and extract user information
 */
const supabaseAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token using Supabase's JWT secret
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      logger.error('JWT secret not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Decode and verify the token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Extract user information from token
    const userId = decoded.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token structure' });
    }

    // Get user profile from database
    const profileQuery = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (profileQuery.rows.length === 0) {
      logger.warn(`Profile not found for user: ${userId}`);
      return res.status(401).json({ error: 'User profile not found' });
    }

    const userProfile = profileQuery.rows[0];

    // Attach user information to request object
    req.user = {
      id: userId,
      email: userProfile.email,
      fullName: userProfile.full_name,
      username: userProfile.username,
      accountType: userProfile.account_type,
      profileId: userProfile.id
    };

    logger.info(`User authenticated: ${userId} (${userProfile.username})`);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else {
      logger.error('Authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

/**
 * Middleware to check if user has specific role
 */
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const roleQuery = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [req.user.id]
      );

      const userRoles = roleQuery.rows.map(row => row.role);
      
      if (!userRoles.includes(requiredRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

/**
 * Legacy auth middleware for backward compatibility
 */
const authMiddleware = supabaseAuthMiddleware;

module.exports = {
  supabaseAuthMiddleware,
  authMiddleware,
  requireRole,
  supabase
};
