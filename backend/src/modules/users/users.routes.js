const express = require('express');
const usersController = require('./users.controller');
const authenticateUser = require('../../middleware/authenticateUser');
const authorizeRoles = require('../../middleware/authorizeRoles');

const router = express.Router();

// All user routes require authentication
router.use(authenticateUser);

// ==========================================
// Authenticated User Own Profile Routes (/me/*)
// (Must be defined before /:id routes to avoid conflict)
// ==========================================

/**
 * PUT /api/users/me
 * Update authenticated user's own profile (Name).
 */
router.put('/me', (req, res, next) => usersController.updateMyProfile(req, res, next));

/**
 * PATCH /api/users/me/profile-picture
 * Upload or change authenticated user's profile picture.
 */
router.patch('/me/profile-picture', (req, res, next) =>
  usersController.updateMyProfilePicture(req, res, next)
);

/**
 * DELETE /api/users/me/profile-picture
 * Remove authenticated user's profile picture.
 */
router.delete('/me/profile-picture', (req, res, next) =>
  usersController.removeMyProfilePicture(req, res, next)
);

/**
 * PATCH /api/users/me/password
 * Change authenticated user's own password.
 */
router.patch('/me/password', (req, res, next) =>
  usersController.changeMyPassword(req, res, next)
);

// ==========================================
// User Directory & Profile Routes
// ==========================================

/**
 * GET /api/users
 * TEAM_MEMBER: returns only self.
 * MANAGER_ADMIN: returns all users (filterable by ?role=&isActive=).
 */
router.get('/', (req, res, next) => usersController.getAllUsers(req, res, next));

/**
 * GET /api/users/:id
 * TEAM_MEMBER: own profile only.
 * MANAGER_ADMIN: any user.
 */
router.get('/:id', (req, res, next) => usersController.getUserById(req, res, next));

/**
 * PUT /api/users/:id
 * TEAM_MEMBER: can update own name and avatar.
 * MANAGER_ADMIN: can update any user's name, avatar, role, isActive.
 */
router.put('/:id', (req, res, next) => usersController.updateUser(req, res, next));

// ==========================================
// MANAGER_ADMIN only routes
// ==========================================

/**
 * PATCH /api/users/:id/deactivate
 * Deactivate a user account. Manager cannot deactivate themselves.
 */
router.patch(
  '/:id/deactivate',
  authorizeRoles('MANAGER_ADMIN'),
  (req, res, next) => usersController.deactivateUser(req, res, next)
);

/**
 * PATCH /api/users/:id/reactivate
 * Reactivate a deactivated user account.
 */
router.patch(
  '/:id/reactivate',
  authorizeRoles('MANAGER_ADMIN'),
  (req, res, next) => usersController.reactivateUser(req, res, next)
);

module.exports = router;
