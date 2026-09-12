import api from './api';

/**
 * Health check API service
 */
export const healthService = {
  /**
   * Fetch backend health status
   * @returns {Promise<{success: boolean, message: string, data: object}>}
   */
  checkHealth: async () => {
    return await api.get('/health');
  },
};

export default healthService;
