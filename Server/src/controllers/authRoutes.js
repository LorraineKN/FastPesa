const express = require('express');
const { register, login, refresh, logout } = require('../controllers/authController');
const { validate } = require('../middlewares/validationMiddleware');
const Joi = require('joi');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

const registerSchema = Joi.object({
  fullName: Joi.string().required(),
  username: Joi.string().alphanum().min(3).max(20).required(),
  pin: Joi.string().length(4).pattern(/^\d+$/).required(),
  phoneNumber: Joi.string().pattern(/^254\d{9}$/).required(),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  pin: Joi.string().length(4).required(),
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);

module.exports = router;