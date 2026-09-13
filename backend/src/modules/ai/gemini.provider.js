const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config/env');

/**
 * Gemini AI Provider
 * Encapsulates Google Generative AI SDK client and interaction logic.
 */
class GeminiProvider {
  constructor() {
    this.apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
    this.candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
      'gemini-flash-latest',
    ];
  }

  /**
   * Check if Gemini API key is available
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Generates a text answer from Gemini given a system instruction and user prompt
   * @param {object} params
   * @param {string} params.systemInstruction - Persona, boundary constraints, and hallucination guardrails
   * @param {string} params.prompt - Structured prompt including context data and manager query
   * @returns {Promise<string>}
   */
  async generateAnswer({ systemInstruction, prompt }) {
    if (!this.isConfigured()) {
      return (
        'AI Assistant is currently in standby mode because no Gemini API key is configured on the server. ' +
        'Please configure GEMINI_API_KEY in the backend environment variables.'
      );
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    let lastError = null;

    for (const modelName of this.candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction || undefined,
          generationConfig: {
            temperature: 0.2, // Low temperature for high factual consistency
            maxOutputTokens: 1200,
          },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err) {
        lastError = err;
        console.warn(`[GeminiProvider] Attempt with model ${modelName} failed:`, err.message || err);
        // If it's an invalid API key, no need to retry across other models
        if (err.message && err.message.includes('API_KEY_INVALID')) {
          break;
        }
      }
    }

    if (lastError) {
      if (lastError.message && lastError.message.includes('API_KEY_INVALID')) {
        return 'AI Assistant is unable to connect: the configured Gemini API key appears to be invalid. Please verify server configuration.';
      }

      if (lastError.message && (lastError.message.includes('RESOURCE_EXHAUSTED') || lastError.message.includes('quota'))) {
        return 'AI Assistant rate limit reached. Please try again in a few moments.';
      }
    }

    return (
      'AI Assistant is temporarily unavailable. Please try again later or consult the dashboard and report records directly.'
    );
  }
}

module.exports = new GeminiProvider();
