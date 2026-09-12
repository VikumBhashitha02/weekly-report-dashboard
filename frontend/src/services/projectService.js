import api from './api';

/**
 * Projects API Service Client
 * Provides methods for project directory, creation, modification, member assignment, and deletion.
 */
export const projectService = {
  /**
   * Fetch active projects (or all projects if showInactive=true for MANAGER_ADMIN)
   * @param {object} [params] - { showInactive?: boolean }
   * @returns {Promise<{ success: boolean, message: string, data: Array }>}
   */
  getProjects: async (params = {}) => {
    return await api.get('/projects', { params });
  },

  /**
   * Fetch distinct project categories
   * @returns {Promise<{ success: boolean, message: string, data: Array<string> }>}
   */
  getCategories: async () => {
    return await api.get('/projects/categories');
  },

  /**
   * Fetch single project by ID
   * @param {string} id - Project ObjectId
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  getProjectById: async (id) => {
    return await api.get(`/projects/${id}`);
  },

  /**
   * Create a new project (MANAGER_ADMIN only)
   * @param {{ name: string, description?: string, category?: string }} data
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  createProject: async (data) => {
    return await api.post('/projects', data);
  },

  /**
   * Update an existing project (MANAGER_ADMIN only)
   * @param {string} id - Project ObjectId
   * @param {{ name?: string, description?: string, category?: string, isActive?: boolean }} updates
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  updateProject: async (id, updates) => {
    return await api.put(`/projects/${id}`, updates);
  },

  /**
   * Assign/replace members on a project (MANAGER_ADMIN only)
   * @param {string} id - Project ObjectId
   * @param {Array<string>} memberIds - Array of User ObjectIds
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  assignMembers: async (id, memberIds) => {
    return await api.patch(`/projects/${id}/members`, { memberIds });
  },

  /**
   * Delete a project permanently (MANAGER_ADMIN only)
   * @param {string} id - Project ObjectId
   * @returns {Promise<{ success: boolean, message: string, data: null }>}
   */
  deleteProject: async (id) => {
    return await api.delete(`/projects/${id}`);
  },
};

export default projectService;
