const ApiError = require('../utils/apiError');

/**
 * 404 Not Found Middleware
 * Catches requests for undefined routes and passes an ApiError to the global errorHandler.
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
