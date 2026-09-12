import api from './api';

/**
 * Reviews API Service Client
 * Provides manager methods for inbox evaluation, approvals, correction requests, and audit logs.
 */
export const reviewService = {
  /**
   * Fetch all submitted reports waiting for manager review
   * @returns {Promise<{ success: boolean, message: string, data: Array }>}
   */
  getPendingReports: async () => {
    return await api.get('/reviews/pending');
  },

  /**
   * Fetch complete review timeline and feedback audit log for a report
   * @param {string} reportId - Report ObjectId
   * @returns {Promise<{ success: boolean, message: string, data: Array }>}
   */
  getReviewHistory: async (reportId) => {
    return await api.get(`/reviews/${reportId}/history`);
  },

  /**
   * Approve a submitted report
   * @param {string} reportId - Report ObjectId
   * @param {string} [comment=''] - Optional approval feedback
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  approveReport: async (reportId, comment = '') => {
    return await api.patch(`/reviews/${reportId}/approve`, { comment });
  },

  /**
   * Request changes / corrections on a submitted report
   * @param {string} reportId - Report ObjectId
   * @param {string} comment - Mandatory correction instructions
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  requestCorrection: async (reportId, comment) => {
    return await api.patch(`/reviews/${reportId}/request-correction`, { comment });
  },
};

export default reviewService;
