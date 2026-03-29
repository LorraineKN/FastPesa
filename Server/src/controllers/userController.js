const userService = require('../services/userService');

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await userService.getProfile(userId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, phoneNumber } = req.body;
    const updatedProfile = await userService.updateProfile(userId, { fullName, phoneNumber });
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
};
