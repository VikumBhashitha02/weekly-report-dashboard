const ApiError = require('../utils/apiError');

// Valid application roles in the assignment
const VALID_SYSTEM_ROLES = ['TEAM_MEMBER', 'MANAGER_ADMIN'];

/**
 * Role-Based Authorization Middleware
 * Verifies that the authenticated user possesses one of the allowed roles.
 * Strictly enforces the two-role system: TEAM_MEMBER and MANAGER_ADMIN.
 *
 * @param  {...string} allowedRoles - List of allowed roles (e.g., 'MANAGER_ADMIN')
 * @returns {import('express').RequestHandler}
 */
const authorizeRoles = (...allowedRoles) => {
  // Validate that middleware configuration only uses valid system roles
  for (const role of allowedRoles) {
    if (!VALID_SYSTEM_ROLES.includes(role)) {
      throw new Error(
        `Invalid role configuration: "${role}". Allowed roles are: [${VALID_SYSTEM_ROLES.join(', ')}]`
      );
    }
  }

  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};

module.exports = authorizeRoles;
