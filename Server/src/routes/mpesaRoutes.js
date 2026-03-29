const express = require('express');
const callbackHandler = require('../integrations/mpesa/callbackHandler');
const { validate } = require('../middlewares/validationMiddleware');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const stkCallbackSchema = Joi.object({
  Body: Joi.object({
    stkCallback: Joi.object({
      MerchantRequestID: Joi.string().required(),
      CheckoutRequestID: Joi.string().required(),
      ResultCode: Joi.number().required(),
      ResultDesc: Joi.string().required(),
      CallbackMetadata: Joi.object({
        Item: Joi.array().items(
          Joi.object({
            Name: Joi.string().required(),
            Value: Joi.alternatives().try(
              Joi.string(),
              Joi.number()
            ).required()
          })
        ).required()
      }).required()
    }).required()
  }).required()
});

const b2cCallbackSchema = Joi.object({
  Result: Joi.object({
    ConversationID: Joi.string().required(),
    TransactionID: Joi.string().required(),
    ResultCode: Joi.number().required(),
    ResultDesc: Joi.string().required(),
    ResultParameters: Joi.object({
      ResultParameter: Joi.array().items(
        Joi.object({
          Key: Joi.string().required(),
          Value: Joi.alternatives().try(
            Joi.string(),
            Joi.number()
          ).required()
        })
      ).required()
    }).required()
  }).required()
});

// STK Push Callback endpoint
router.post('/callback', validate(stkCallbackSchema), callbackHandler.handleSTKCallback);

// B2C Result Callback endpoint
router.post('/b2c-result', validate(b2cCallbackSchema), callbackHandler.handleB2CCallback);

// B2C Timeout Callback endpoint
router.post('/timeout', callbackHandler.handleB2CCallback);

// Health check for M-Pesa routes
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'M-Pesa Daraja Integration',
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;
