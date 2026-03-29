const express = require('express');
const { authMiddleware } = require('../controllers/authMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

module.exports = router;
