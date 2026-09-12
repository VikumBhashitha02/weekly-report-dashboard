import api from './api';

/**
 * Users & Team Management API Service Client
 * Provides methods for viewing user directories and managing active/deactivated statuses.
 */
export const userService = {
  /**
   * Fetch all users (with optional filtering by role or active status)
   * @param {object} [params] - { role?: string, isActive?: boolean }
   * @returns {Promise<{ success: boolean, message: string, data: Array }>}
   */
  getUsers: async (params = {}) => {
    return await api.get('/users', { params });
  },

  /**
   * Fetch single user profile by ID
   * @param {string} id - User ObjectId
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  getUserById: async (id) => {
    return await api.get(`/users/${id}`);
  },

  /**
   * Update user profile details
   * @param {string} id - User ObjectId
   * @param {object} updates - { name?: string, avatar?: string, role?: string, isActive?: boolean }
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  updateUser: async (id, updates) => {
    return await api.put(`/users/${id}`, updates);
  },

  /**
   * Deactivate a user account (MANAGER_ADMIN only, cannot self-deactivate)
   * @param {string} id - User ObjectId
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  deactivateUser: async (id) => {
    return await api.patch(`/users/${id}/deactivate`);
  },

  /**
   * Reactivate a previously deactivated user account (MANAGER_ADMIN only)
   * @param {string} id - User ObjectId
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  reactivateUser: async (id) => {
    return await api.patch(`/users/${id}/reactivate`);
  },

  /**
   * Update authenticated user's own profile info (name)
   * @param {object} data - { name: string }
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  updateProfile: async (data) => {
    return await api.put('/users/me', data);
  },

  /**
   * Upload / update authenticated user's profile picture
   * @param {string} image - Base64 data URL
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  updateProfilePicture: async (image) => {
    return await api.patch('/users/me/profile-picture', { image });
  },

  /**
   * Remove authenticated user's profile picture
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  removeProfilePicture: async () => {
    return await api.delete('/users/me/profile-picture');
  },

  /**
   * Change authenticated user's password
   * @param {object} data - { currentPassword, newPassword, confirmPassword }
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  changePassword: async (data) => {
    return await api.patch('/users/me/password', data);
  },
};

export default userService;

