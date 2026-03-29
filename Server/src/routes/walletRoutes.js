const express = require('express');
const { authMiddleware } = require('../controllers/authMiddleware');
const walletController = require('../controllers/walletController');
const { validate } = require('../middlewares/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

const rechargeSchema = Joi.object({
  amount: Joi.number().positive().required(),
  phoneNumber: Joi.string().pattern(/^\+?254\d{9}$/).required(),
});

const callbackSchema = Joi.object({
  transactionId: Joi.string().required(),
  status: Joi.string().valid('success', 'failed').required(),
});

router.get('/', authMiddleware, walletController.getWallet);
router.post('/recharge', authMiddleware, validate(rechargeSchema), walletController.recharge);
router.post('/mock-callback', validate(callbackSchema), walletController.mockCallback);

module.exports = router;
