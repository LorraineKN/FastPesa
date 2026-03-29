const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Session = require('../models/Session');
const { comparePin } = require('../utils/hash');
const { generateToken, verifyToken, hashToken } = require('../utils/token');
const { getRedis } = require('../config/redis');
const env = require('../config/env');
const AuditLog = require('../models/AuditLog');

class AuthService {
  async register(fullName, username, pin, phoneNumber, ipAddress) {
    const existing = await User.findByUsername(username);
    if (existing) throw new Error('Username already exists');

    const user = await User.create({ fullName, username, pin, phoneNumber });
    await Wallet.create(user.id);
    await AuditLog.log({ userId: user.id, action: 'REGISTER', metadata: {}, ipAddress });
    return { user };
  }

  async login(username, pin, deviceInfo, ipAddress) {
    const user = await User.findByUsername(username);
    if (!user) throw new Error('Invalid credentials');
    if (user.status === 'locked') throw new Error('Account locked. Contact support.');

    const isValid = await comparePin(pin, user.pin_hash);
    if (!isValid) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      await User.updateFailedAttempts(user.id, newAttempts);
      if (newAttempts >= 5) await User.lockAccount(user.id);
      throw new Error('Invalid credentials');
    }

    await User.updateLastLogin(user.id);
    const accessToken = generateToken({ userId: user.id }, env.JWT_ACCESS_EXPIRY);
    const refreshToken = generateToken({ userId: user.id, type: 'refresh' }, env.JWT_REFRESH_EXPIRY);

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Session.create({ userId: user.id, tokenHash, expiresAt, deviceInfo, ipAddress });

    await AuditLog.log({ userId: user.id, action: 'LOGIN', metadata: {}, ipAddress });

    return { accessToken, refreshToken, user: { id: user.id, fullName: user.full_name, username: user.username } };
  }

  async refreshToken(refreshToken) {
    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') throw new Error('Invalid refresh token');
    const tokenHash = hashToken(refreshToken);
    const session = await Session.findByTokenHash(tokenHash);
    if (!session) throw new Error('Session expired');

    const newAccessToken = generateToken({ userId: payload.userId }, env.JWT_ACCESS_EXPIRY);
    return { accessToken: newAccessToken };
  }

  async logout(refreshToken, userId) {
    const tokenHash = hashToken(refreshToken);
    const session = await Session.findByTokenHash(tokenHash);
    if (session) await Session.revokeAllForUser(userId);
  }
}

module.exports = new AuthService();