const authService = require('./auth.service');
const ApiResponse = require('../../utils/apiResponse');
const config = require('../../config/env');

/**
 * Authentication HTTP Request Controller
 */
class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body);

      // Attach token in secure HTTP-only cookie
      res.cookie(config.cookieName, token, authService.getCookieOptions());

      return ApiResponse.created(res, user, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authenticate user & establish session
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { user, token } = await authService.login(req.body);

      // Attach token in secure HTTP-only cookie
      res.cookie(config.cookieName, token, authService.getCookieOptions());

      return ApiResponse.success(res, user, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log out user & destroy session cookie
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      res.clearCookie(config.cookieName, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
      });
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve current authenticated user profile
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      const safeUser = authService.formatSafeUser(req.user);
      return ApiResponse.success(res, safeUser, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
