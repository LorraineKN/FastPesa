const paymentService = require('../services/paymentService');

exports.sendToPhone = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { phoneNumber, amount } = req.body;
    const ipAddress = req.ip;
    const result = await paymentService.sendToPhone(userId, phoneNumber, amount, ipAddress);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
