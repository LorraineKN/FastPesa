const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

const generateToken = (payload, expiresIn) => jwt.sign(payload, env.JWT_SECRET, { expiresIn });
const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
};
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { generateToken, verifyToken, hashToken };