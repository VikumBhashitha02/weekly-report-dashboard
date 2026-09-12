const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const ApiError = require('../../utils/apiError');
const { User } = require('../../models');

/**
 * Authentication Business Logic Service
 */
class AuthService {
  /**
   * Register a new user
   * Note: Public registration unconditionally assigns the TEAM_MEMBER role.
   */
  async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing account
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists');
    }

    // Hash password with bcrypt (salt rounds: 10)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user strictly with TEAM_MEMBER role
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'TEAM_MEMBER', // Enforce team member role
      isActive: true,
    });

    // Generate JWT token
    const token = this.generateToken(newUser);
    const safeUser = this.formatSafeUser(newUser);

    return { user: safeUser, token };
  }

  /**
   * Authenticate an existing user
   */
  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Explicitly query user with hidden password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      // Generic error message prevents email enumeration
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Verify bcrypt password hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Reject deactivated accounts
    if (!user.isActive) {
      throw ApiError.unauthorized(
        'Account has been deactivated. Please contact an administrator.'
      );
    }

    // Generate JWT token
    const token = this.generateToken(user);
    const safeUser = this.formatSafeUser(user);

    return { user: safeUser, token };
  }

  /**
   * Generate signed JSON Web Token (JWT)
   * Payload contains only minimal identity info (userId, role)
   */
  generateToken(user) {
    const payload = {
      userId: user._id,
      role: user.role,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  }

  /**
   * Format safe user response omitting sensitive fields
   */
  formatSafeUser(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Standard cookie options for HTTP-only session cookies
   */
  getCookieOptions() {
    const isProduction = config.nodeEnv === 'production';
    return {
      httpOnly: true, // Mitigates XSS token theft
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax', // CSRF mitigation
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    };
  }
}

module.exports = new AuthService();
