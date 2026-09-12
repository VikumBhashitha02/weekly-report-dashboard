import api from './api';

/**
 * Weekly Reports API Service Client
 * Encapsulates all backend interaction for reports and version history
 */
export const reportService = {
  /**
   * Fetch all reports for the current authenticated user (with optional query filters)
   * @param {object} [params] - { status, projectId, weekStart, weekEnd }
   * @returns {Promise<{ success: boolean, message: string, data: Array }>}
   */
  getReports: async (params = {}) => {
    return await api.get('/reports', { params });
  },

  /**
   * Fetch a single report by ID
   * @param {string} id - Report ObjectId
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  getReportById: async (id) => {
    return await api.get(`/reports/${id}`);
  },

  /**
   * Create a new draft report
   * @param {object} reportData - Validated payload matching createReportSchema
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  createReport: async (reportData) => {
    return await api.post('/reports', reportData);
  },

  /**
   * Update an existing draft or needs-correction report
   * @param {string} id - Report ObjectId
   * @param {object} updates - Validated payload matching updateReportSchema
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  updateReport: async (id, updates) => {
    return await api.put(`/reports/${id}`, updates);
  },

  /**
   * Submit a report for manager review
   * Increments version, captures snapshot, transitions status to SUBMITTED
   * @param {string} id - Report ObjectId
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  submitReport: async (id) => {
    return await api.patch(`/reports/${id}/submit`);
  },

  /**
   * Delete a draft report (DRAFT status only)
   * @param {string} id - Report ObjectId
   * @returns {Promise<{ success: boolean, message: string, data: null }>}
   */
  deleteReport: async (id) => {
    return await api.delete(`/reports/${id}`);
  },

  /**
   * Fetch immutable version snapshots for a report
   * @param {string} id - Report ObjectId
   * @returns {Promise<{ success: boolean, message: string, data: Array }>}
   */
  getReportVersions: async (id) => {
    return await api.get(`/reports/${id}/versions`);
  },
};

export default reportService;
