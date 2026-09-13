import api from './api';

/**
 * AI Management Assistant API Client
 */
export const aiService = {
  /**
   * Send a query or summary prompt to the Gemini AI Management Assistant
   * @param {string} message - Manager question or prompt
   * @returns {Promise<{ success: boolean, data: { message: string, timestamp: string } }>}
   */
  chatWithAssistant: async (message) => {
    return await api.post('/ai/chat', { message }, { timeout: 60000 });
  },
};

export default aiService;
