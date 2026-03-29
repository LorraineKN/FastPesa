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

exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // For now, return default preferences
    res.json({
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 24 // hours
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;
    // For now, just return success (future: save to database)
    res.json({ 
      success: true, 
      message: 'Preferences updated successfully',
      preferences 
    });
  } catch (error) {
    next(error);
  }
};
