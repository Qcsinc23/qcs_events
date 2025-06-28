/**
 * Global Error Handler Middleware
 * Centralized error handling for the Quiet Craft Solutions backend
 */

const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.logError(err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const value = Object.values(err.keyValue)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again!';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired! Please log in again.';
    error = new AppError(message, 401);
  }

  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => e.message);
    const message = `Validation error: ${errors.join('. ')}`;
    error = new AppError(message, 400);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate entry found';
    error = new AppError(message, 400);
  }

  if (err.name === 'SequelizeDatabaseError') {
    const message = 'Database error occurred';
    error = new AppError(message, 500);
  }

  // Clerk authentication errors
  if (err.name === 'ClerkAPIError') {
    const message = 'Authentication error. Please try again.';
    error = new AppError(message, 401);
  }

  // OpenRouter API errors
  if (err.response && err.response.status) {
    if (err.response.status === 401) {
      const message = 'AI service authentication failed';
      error = new AppError(message, 503);
    } else if (err.response.status === 429) {
      const message = 'AI service rate limit exceeded. Please try again later.';
      error = new AppError(message, 429);
    } else if (err.response.status >= 500) {
      const message = 'AI service temporarily unavailable';
      error = new AppError(message, 503);
    }
  }

  // Google Maps API errors
  if (err.message && err.message.includes('Google Maps')) {
    const message = 'Location service temporarily unavailable';
    error = new AppError(message, 503);
  }

  // Send error response
  sendErrorResponse(error, req, res);
};

// Send error response
const sendErrorResponse = (err, req, res) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  
  // Determine if we should send detailed error info
  const isDev = process.env.NODE_ENV === 'development';
  const isOperational = err.isOperational || false;

  if (isDev) {
    // Development: send detailed error info
    res.status(statusCode).json({
      status,
      error: err,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  } else if (isOperational) {
    // Production: only send operational errors
    res.status(statusCode).json({
      status,
      message: err.message,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  } else {
    // Production: don't leak error details
    logger.error('Programming Error:', err);
    
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  }
};

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Not found handler
const notFound = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

module.exports = {
  errorHandler,
  AppError,
  catchAsync,
  notFound
};
