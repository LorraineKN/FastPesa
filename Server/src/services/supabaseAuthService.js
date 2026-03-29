const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate JWT token compatible with Supabase
 */
const generateSupabaseToken = (user) => {
  const payload = {
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
    sub: user.id,
    email: user.email,
    role: 'authenticated',
    user_metadata: {
      full_name: user.full_name,
      account_type: user.account_type,
      username: user.username
    },
    app_metadata: {
      provider: 'email',
      roles: ['user']
    }
  };

  const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';
  return jwt.sign(payload, jwtSecret);
};

/**
 * Register a new user
 */
const registerUser = async (email, password, fullName, username, accountType = 'personal') => {
  try {
    logger.info(`Registering new user: ${email}`);

    // Check if user already exists in profiles
    const existingProfile = await pool.query(
      'SELECT * FROM profiles WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingProfile.rows.length > 0) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = uuidv4();

    // Create profile in our database
    const profileQuery = await pool.query(
      `INSERT INTO profiles (user_id, email, full_name, username, account_type, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, email, fullName, username, accountType, false]
    );

    const profile = profileQuery.rows[0];

    // Store password in legacy_users table for compatibility
    await pool.query(
      `INSERT INTO legacy_users (id, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash`,
      [userId, email, hashedPassword]
    );

    // Create user role
    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [profile.user_id, 'user']
    );

    // Ensure demo wallet is created (this will create the wallet with demo funds)
    const walletResult = await pool.query('SELECT * FROM ensure_demo_wallet($1, $2, $3, $4, $5)', [
      profile.user_id,
      fullName,
      email,
      username,
      accountType
    ]);

    // Generate token
    const token = generateSupabaseToken({
      id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      account_type: profile.account_type,
      username: profile.username
    });

    logger.info(`User registered successfully: ${email}`);

    return {
      user: {
        id: profile.user_id,
        email: profile.email,
        fullName: profile.full_name,
        username: profile.username,
        accountType: profile.account_type
      },
      token,
      session: {
        access_token: token,
        user: {
          id: profile.user_id,
          email: profile.email,
          user_metadata: {
            full_name: profile.full_name,
            account_type: profile.account_type,
            username: profile.username
          }
        }
      }
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user
 */
const loginUser = async (email, password) => {
  try {
    logger.info(`User login attempt: ${email}`);

    // Get user from legacy_users table
    const userQuery = await pool.query(
      'SELECT * FROM legacy_users WHERE email = $1',
      [email]
    );

    if (userQuery.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = userQuery.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Get user profile
    const profileQuery = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [user.id]
    );

    if (profileQuery.rows.length === 0) {
      throw new Error('User profile not found');
    }

    const profile = profileQuery.rows[0];

    // Generate token
    const token = generateSupabaseToken({
      id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      account_type: profile.account_type,
      username: profile.username
    });

    logger.info(`User logged in successfully: ${email}`);

    return {
      user: {
        id: profile.user_id,
        email: profile.email,
        fullName: profile.full_name,
        username: profile.username,
        accountType: profile.account_type
      },
      token,
      session: {
        access_token: token,
        user: {
          id: profile.user_id,
          email: profile.email,
          user_metadata: {
            full_name: profile.full_name,
            account_type: profile.account_type,
            username: profile.username
          }
        }
      }
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout user
 */
const logoutUser = async (token) => {
  try {
    // For local auth, we can implement token blacklisting if needed
    logger.info('User logged out successfully');
    return { success: true };
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};

/**
 * Refresh token
 */
const refreshToken = async (refreshToken) => {
  try {
    // For local auth, verify the existing token and issue a new one
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'super-secret-jwt-key-change-me');
    
    // Get user profile
    const profileQuery = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [decoded.sub]
    );

    if (profileQuery.rows.length === 0) {
      throw new Error('User not found');
    }

    const profile = profileQuery.rows[0];

    // Generate new token
    const token = generateSupabaseToken({
      id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      account_type: profile.account_type,
      username: profile.username
    });

    return {
      access_token: token,
      user: {
        id: profile.user_id,
        email: profile.email,
        user_metadata: {
          full_name: profile.full_name,
          account_type: profile.account_type,
          username: profile.username
        }
      }
    };
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw new Error('Failed to refresh token');
  }
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  try {
    const profileQuery = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (profileQuery.rows.length === 0) {
      return null;
    }

    const profile = profileQuery.rows[0];

    // Get user roles
    const rolesQuery = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [userId]
    );

    const roles = rolesQuery.rows.map(row => row.role);

    return {
      id: profile.user_id,
      email: profile.email,
      fullName: profile.full_name,
      username: profile.username,
      accountType: profile.account_type,
      phone: profile.phone,
      isVerified: profile.is_verified,
      roles
    };
  } catch (error) {
    logger.error('Get user by ID error:', error);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  getUserById,
  generateSupabaseToken
};
