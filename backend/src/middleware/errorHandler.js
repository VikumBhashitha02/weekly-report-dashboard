const config = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Centralized Error Handling Middleware
 * Converts all errors (Mongoose, Zod, JWT, custom ApiError, syntax errors)
 * into a standardized JSON response format.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid resource identifier: ${err.path}`;
    error = ApiError.badRequest(message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    error = ApiError.badRequest('Validation Error', errors);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    const message = `${field} already exists.`;
    error = ApiError.conflict(message);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authentication token has expired');
  }

  // Handle Zod Validation Error (if passed directly)
  if (err.name === 'ZodError') {
    const errors = (err.errors || []).map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    error = ApiError.badRequest('Validation Error', errors);
  }

  // Extract status code and payload
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  const responsePayload = {
    success: false,
    message,
    ...(errors.length > 0 ? { errors } : {}),
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  };

  // Log error details for server diagnostics
  if (statusCode >= 500) {
    console.error(`[Server Error 500] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
