import api from './api';

/**
 * Authentication Service Client
 * Interacts with backend /api/auth endpoints using HTTP-only cookies.
 */
export const authService = {
  /**
   * Register a new user
   * @param {{ name: string, email: string, password: string }} userData
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  /**
   * Log in an existing user
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  /**
   * Log out the current user and clear HTTP-only cookie
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  logout: async () => {
    return await api.post('/auth/logout');
  },

  /**
   * Retrieve the current authenticated user session
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  getMe: async () => {
    return await api.get('/auth/me');
  },
};

export default authService;
