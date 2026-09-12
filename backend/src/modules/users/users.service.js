const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const ApiError = require('../../utils/apiError');
const { validateAndSaveAvatar, deleteAvatarFile } = require('../../utils/imageStorage');

// ==========================================
// Users Service
// Profile, Team Directory, and Password Actions
// ==========================================

/**
 * Get all users.
 * MANAGER_ADMIN: see all users.
 * TEAM_MEMBER: sees only themselves (for profile use).
 *
 * @param {{ role, userId, query }} options
 * @returns {Promise<User[]>}
 */
const getAllUsers = async ({ role, userId, query = {} }) => {
  let filter = {};

  if (role === 'TEAM_MEMBER') {
    // Team members can only see themselves
    filter._id = userId;
  } else {
    // Manager can optionally filter by role or active status
    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 });

  return users;
};

/**
 * Get a single user by ID.
 * TEAM_MEMBER: can only fetch their own profile.
 * MANAGER_ADMIN: can fetch any user.
 *
 * @param {string} targetUserId
 * @param {{ role, userId }} options
 * @returns {Promise<User>}
 */
const getUserById = async (targetUserId, { role, userId }) => {
  if (role === 'TEAM_MEMBER' && targetUserId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only view your own profile.');
  }

  const user = await User.findById(targetUserId).select('-password');
  if (!user) throw ApiError.notFound('User not found.');

  return user;
};

/**
 * Update a user's profile.
 * TEAM_MEMBER: can only update their own name and avatar.
 * MANAGER_ADMIN: can update any user's name, avatar, and role.
 *
 * @param {string} targetUserId
 * @param {object} updates
 * @param {{ role, userId }} options
 * @returns {Promise<User>}
 */
const updateUser = async (targetUserId, updates, { role, userId }) => {
  if (role === 'TEAM_MEMBER' && targetUserId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only update your own profile.');
  }

  const user = await User.findById(targetUserId);
  if (!user) throw ApiError.notFound('User not found.');

  // Team members can only update name and avatar
  const allowedFields =
    role === 'MANAGER_ADMIN'
      ? ['name', 'avatar', 'role', 'isActive']
      : ['name', 'avatar'];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === 'name') {
        const trimmed = updates.name.trim();
        if (!trimmed) throw ApiError.badRequest('Name cannot be empty.');
        user.name = trimmed;
      } else {
        user[field] = updates[field];
      }
    }
  }

  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Update the authenticated user's own profile (Name).
 *
 * @param {string} userId - Authenticated user ObjectId
 * @param {{ name: string }} data
 * @returns {Promise<User>}
 */
const updateProfile = async (userId, { name }) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');

  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) throw ApiError.badRequest('Name cannot be empty.');
    user.name = trimmed;
  }

  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Update the authenticated user's profile picture.
 * Validates base64 data URI, magic bytes, file size, and stores safely.
 *
 * @param {string} userId - Authenticated user ObjectId
 * @param {string} base64Image - Image data URI
 * @returns {Promise<User>}
 */
const updateProfilePicture = async (userId, base64Image) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');

  // Clean up any existing local avatar file
  deleteAvatarFile(user.avatar);

  // Validate and store new avatar
  const avatarPath = validateAndSaveAvatar(base64Image, userId);
  user.avatar = avatarPath;
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Remove the authenticated user's profile picture and return to default avatar initials.
 *
 * @param {string} userId - Authenticated user ObjectId
 * @returns {Promise<User>}
 */
const removeProfilePicture = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');

  deleteAvatarFile(user.avatar);
  user.avatar = null;
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Change the authenticated user's password.
 * Validates current password via bcrypt and enforces strong password rules.
 *
 * @param {string} userId - Authenticated user ObjectId
 * @param {{ currentPassword, newPassword, confirmPassword }} data
 * @returns {Promise<{ message: string }>}
 */
const changePassword = async (userId, { currentPassword, newPassword, confirmPassword }) => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw ApiError.badRequest('Current password, new password, and confirmation password are required.');
  }

  if (newPassword !== confirmPassword) {
    throw ApiError.badRequest('New password and confirmation password do not match.');
  }

  if (newPassword.length < 8) {
    throw ApiError.badRequest('New password must be at least 8 characters long.');
  }

  if (
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/[0-9]/.test(newPassword) ||
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
  ) {
    throw ApiError.badRequest(
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    );
  }

  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found.');

  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  if (currentPassword === newPassword) {
    throw ApiError.badRequest('New password cannot be the same as your current password.');
  }

  // Hash new password
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: 'Password updated successfully.' };
};

/**
 * Deactivate a user account.
 * MANAGER_ADMIN only.
 * Prevents self-deactivation.
 *
 * @param {string} targetUserId
 * @param {string} adminUserId - the requesting manager's ID
 * @returns {Promise<User>}
 */
const deactivateUser = async (targetUserId, adminUserId) => {
  if (targetUserId.toString() === adminUserId.toString()) {
    throw ApiError.badRequest('You cannot deactivate your own account.');
  }

  const user = await User.findById(targetUserId);
  if (!user) throw ApiError.notFound('User not found.');
  if (!user.isActive) throw ApiError.badRequest('User is already deactivated.');

  user.isActive = false;
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Reactivate a user account.
 * MANAGER_ADMIN only.
 *
 * @param {string} targetUserId
 * @returns {Promise<User>}
 */
const reactivateUser = async (targetUserId) => {
  const user = await User.findById(targetUserId);
  if (!user) throw ApiError.notFound('User not found.');
  if (user.isActive) throw ApiError.badRequest('User is already active.');

  user.isActive = true;
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateProfile,
  updateProfilePicture,
  removeProfilePicture,
  changePassword,
  deactivateUser,
  reactivateUser,
};
