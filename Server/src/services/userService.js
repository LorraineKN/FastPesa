const User = require('../models/User');
const Wallet = require('../models/Wallet');

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  const wallet = await Wallet.findByUserId(userId);
  
  return {
    id: user.id,
    fullName: user.full_name,
    username: user.username,
    phoneNumber: user.phone_number,
    status: user.status,
    wallet: wallet ? {
      balance: parseFloat(wallet.balance),
      dailyLimit: wallet.daily_limit,
      monthlyLimit: wallet.monthly_limit,
      isLocked: wallet.is_locked
    } : null
  };
};

const updateProfile = async (userId, { fullName, phoneNumber }) => {
  const { query } = require('../config/db');
  const sql = `
    UPDATE users 
    SET full_name = COALESCE($1, full_name), 
        phone_number = COALESCE($2, phone_number), 
        updated_at = NOW() 
    WHERE id = $3 
    RETURNING id, full_name, username, phone_number, status
  `;
  
  const result = await query(sql, [fullName, phoneNumber, userId]);
  if (result.rows.length === 0) throw new Error('User not found');
  
  return result.rows[0];
};

module.exports = {
  getProfile,
  updateProfile
};
