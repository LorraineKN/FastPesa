const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    const { fullName, username, pin, phoneNumber } = req.body;
    const ipAddress = req.ip;
    const result = await authService.register(fullName, username, pin, phoneNumber, ipAddress);
    res.status(201).json({ message: 'User registered', user: result.user });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, pin } = req.body;
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip;
    const tokens = await authService.login(username, pin, deviceInfo, ipAddress);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;
    await authService.logout(refreshToken, req.user.id);
    res.json({ message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};