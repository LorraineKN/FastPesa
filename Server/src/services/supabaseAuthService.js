const bcrypt = require('bcrypt');
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

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/emergency_wallet'
});

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

  const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key';
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

    // Create user in Supabase auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        account_type: accountType,
        username
      }
    });

    if (authError) {
      logger.error('Supabase auth error:', authError);
      throw new Error('Failed to create user in authentication system');
    }

    // Create profile in our database
    const profileQuery = await pool.query(
      `INSERT INTO profiles (user_id, email, full_name, username, account_type, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [authData.user.id, email, fullName, username, accountType, false]
    );

    const profile = profileQuery.rows[0];

    // Create user role
    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [profile.user_id, 'user']
    );

    // Ensure demo wallet is created
    await pool.query('SELECT * FROM ensure_demo_wallet($1, $2, $3, $4, $5)', [
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
        user: authData.user
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

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      logger.error('Supabase login error:', authError);
      throw new Error('Invalid email or password');
    }

    // Get user profile
    const profileQuery = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [authData.user.id]
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
      session: authData.session
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
    // For Supabase, we can revoke the session
    const { error } = await supabase.auth.admin.signOut(token);
    
    if (error) {
      logger.error('Logout error:', error);
    }

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
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      throw new Error('Failed to refresh token');
    }

    return data;
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw error;
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
  generateSupabaseToken,
  supabase
};
