const usersService = require('./users.service');
const ApiResponse = require('../../utils/apiResponse');

// ==========================================
// Users Controller
// ==========================================

/**
 * @route   GET /api/users
 * @desc    Get all users (TEAM_MEMBER: self only, MANAGER_ADMIN: all)
 * @access  Authenticated
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await usersService.getAllUsers({
      role: req.user.role,
      userId: req.user._id,
      query: req.query,
    });
    return ApiResponse.success(res, users, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (TEAM_MEMBER: self only)
 * @access  Authenticated
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id, {
      role: req.user.role,
      userId: req.user._id,
    });
    return ApiResponse.success(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile (TEAM_MEMBER: own name/avatar, MANAGER_ADMIN: any field)
 * @access  Authenticated
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body, {
      role: req.user.role,
      userId: req.user._id,
    });
    return ApiResponse.success(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/me
 * @desc    Update authenticated user's own profile (name)
 * @access  Authenticated (Both roles)
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const user = await usersService.updateProfile(req.user._id, req.body);
    return ApiResponse.success(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/users/me/profile-picture
 * @desc    Upload or change authenticated user's profile picture
 * @access  Authenticated (Both roles)
 */
const updateMyProfilePicture = async (req, res, next) => {
  try {
    const { image } = req.body;
    const user = await usersService.updateProfilePicture(req.user._id, image);
    return ApiResponse.success(res, user, 'Profile picture updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/users/me/profile-picture
 * @desc    Remove authenticated user's profile picture
 * @access  Authenticated (Both roles)
 */
const removeMyProfilePicture = async (req, res, next) => {
  try {
    const user = await usersService.removeProfilePicture(req.user._id);
    return ApiResponse.success(res, user, 'Profile picture removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/users/me/password
 * @desc    Change authenticated user's password
 * @access  Authenticated (Both roles)
 */
const changeMyPassword = async (req, res, next) => {
  try {
    const result = await usersService.changePassword(req.user._id, req.body);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Deactivate a user account
 * @access  MANAGER_ADMIN only
 */
const deactivateUser = async (req, res, next) => {
  try {
    const user = await usersService.deactivateUser(req.params.id, req.user._id);
    return ApiResponse.success(res, user, 'User deactivated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/users/:id/reactivate
 * @desc    Reactivate a user account
 * @access  MANAGER_ADMIN only
 */
const reactivateUser = async (req, res, next) => {
  try {
    const user = await usersService.reactivateUser(req.params.id);
    return ApiResponse.success(res, user, 'User reactivated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateMyProfile,
  updateMyProfilePicture,
  removeMyProfilePicture,
  changeMyPassword,
  deactivateUser,
  reactivateUser,
};
