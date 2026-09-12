const express = require('express');
const authController = require('./auth.controller');
const { registerSchema, loginSchema, validate } = require('./auth.validation');
const authenticateUser = require('../../middleware/authenticateUser');
const authorizeRoles = require('../../middleware/authorizeRoles');
const ApiResponse = require('../../utils/apiResponse');

const router = express.Router();

// ==========================================
// Public Authentication Routes
// ==========================================

router.post('/register', validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

// ==========================================
// Protected Authentication Routes
// ==========================================

router.get('/me', authenticateUser, (req, res, next) =>
  authController.getMe(req, res, next)
);

// ==========================================
// RBAC Verification Test Routes
// (Provided for Phase 3 role verification)
// ==========================================

router.get(
  '/test-member',
  authenticateUser,
  authorizeRoles('TEAM_MEMBER', 'MANAGER_ADMIN'),
  (req, res) => {
    return ApiResponse.success(
      res,
      { role: req.user.role },
      'Member/Manager-Admin access granted'
    );
  }
);

router.get(
  '/test-manager-admin',
  authenticateUser,
  authorizeRoles('MANAGER_ADMIN'),
  (req, res) => {
    return ApiResponse.success(
      res,
      { role: req.user.role },
      'Manager-Admin access granted'
    );
  }
);

module.exports = router;
