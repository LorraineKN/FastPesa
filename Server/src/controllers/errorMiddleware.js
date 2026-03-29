const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    error = { status: 400, message, details: err.details };
  }

  if (err.code === '23505') {
    const message = 'Duplicate entry found';
    error = { status: 409, message };
  }

  if (err.code === '23503') {
    const message = 'Referenced resource not found';
    error = { status: 404, message };
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { status: 401, message };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { status: 401, message };
  }

  // Handle authentication errors
  if (err.message === 'Invalid credentials' || err.message === 'Username already exists' || err.message === 'Account locked. Contact support.') {
    error = { status: 401, message: err.message };
  }

  // Handle 404 errors specifically
  if (err.message && err.message.includes('not found')) {
    error = { status: 404, message: err.message };
  }

  const status = error.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500 
    ? 'Internal Server Error' 
    : error.message || 'Internal Server Error';

  const response = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.url
  };

  if (error.details && (process.env.NODE_ENV === 'development' || status < 500)) {
    response.details = error.details;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};