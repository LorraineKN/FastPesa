const walletService = require('../services/walletService');

exports.getWallet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wallet = await walletService.getBalance(userId);
    res.json(wallet);
  } catch (error) {
    next(error);
  }
};

exports.recharge = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, phoneNumber } = req.body;
    const ipAddress = req.ip;
    const result = await walletService.recharge(userId, amount, phoneNumber, ipAddress);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
