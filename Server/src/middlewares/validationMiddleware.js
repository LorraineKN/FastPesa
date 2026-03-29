const Joi = require('joi');
const logger = require('../utils/logger');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));
      
      logger.warn('Validation failed', { 
        url: req.url, 
        method: req.method, 
        errors: validationErrors 
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    if (source === 'body') req.body = value;
    else if (source === 'query') req.query = value;
    else req.params = value;
    
    next();
  };
};

const schemas = {
  register: Joi.object({
    fullName: Joi.string().min(2).max(100).required().label('Full name'),
    username: Joi.string().alphanum().min(3).max(30).required().label('Username'),
    pin: Joi.string().pattern(/^\d{4}$/).required().label('PIN must be 4 digits'),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().label('Phone number')
  }),
  
  login: Joi.object({
    username: Joi.string().required().label('Username'),
    pin: Joi.string().pattern(/^\d{4}$/).required().label('PIN must be 4 digits')
  }),
  
  refreshToken: Joi.object({
    refreshToken: Joi.string().required().label('Refresh token')
  }),
  
  recharge: Joi.object({
    amount: Joi.number().positive().max(50000).required().label('Amount'),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().label('Phone number')
  }),
  
  payment: Joi.object({
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().label('Phone number'),
    amount: Joi.number().positive().max(5000).required().label('Amount')
  }),
  
  transactions: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10).label('Limit'),
    offset: Joi.number().integer().min(0).default(0).label('Offset')
  })
};

module.exports = { 
  validate, 
  schemas 
};
