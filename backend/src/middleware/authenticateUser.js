const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const { User } = require('../models');

/**
 * Authentication Middleware
 * Verifies JWT token from HTTP-only cookie or Authorization Bearer header,
 * loads the authenticated user record from the database, confirms the account is active,
 * and attaches the user document to req.user (without password).
 */
const authenticateUser = async (req, res, next) => {
  try {
    let token = null;

    // 1. Read token from HTTP-only cookie
    if (req.cookies && req.cookies[config.cookieName]) {
      token = req.cookies[config.cookieName];
    }
    // 2. Read token from Authorization header (Bearer <token>) as fallback
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication required. Please log in.'));
    }

    // 3. Verify JWT token signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Session expired. Please log in again.'));
      }
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }

    // 4. Load user from database using the decoded userId
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(ApiError.unauthorized('User account no longer exists.'));
    }

    // 5. Confirm user is active
    if (!user.isActive) {
      return next(
        ApiError.unauthorized('Account has been deactivated. Please contact an administrator.')
      );
    }

    // 6. Attach authenticated user to request context (password is excluded by default)
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticateUser;
