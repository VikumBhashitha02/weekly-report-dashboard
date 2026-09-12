import api from './api';

/**
 * Dashboard API Service Client
 * Provides methods for manager statistics, submission trends, and member performance summary.
 */
export const dashboardService = {
  /**
   * Fetch top-level dashboard statistics
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  getStats: async () => {
    return await api.get('/dashboard/stats');
  },

  /**
   * Fetch weekly report submission trend
   * @param {number} [weeks=8] - Number of weeks to look back
   * @returns {Promise<{ success: boolean, message: string, data: Array }>}
   */
  getWeeklyTrend: async (weeks = 8) => {
    return await api.get('/dashboard/trend', { params: { weeks } });
  },

  /**
   * Fetch per-member report submission and review summary
   * @returns {Promise<{ success: boolean, message: string, data: Array }>}
   */
  getMemberSummary: async () => {
    return await api.get('/dashboard/members');
  },
};

export default dashboardService;
