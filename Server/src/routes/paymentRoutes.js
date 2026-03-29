const express = require('express');
const { authMiddleware } = require('../controllers/authMiddleware');
const paymentController = require('../controllers/paymentController');
const { validate } = require('../middlewares/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

const paymentSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^254\d{9}$/).required(),
  amount: Joi.number().positive().required(),
});

router.post('/phone', authMiddleware, validate(paymentSchema), paymentController.sendToPhone);

module.exports = router;
