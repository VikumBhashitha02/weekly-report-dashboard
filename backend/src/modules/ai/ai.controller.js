const { z } = require('zod');
const aiService = require('./ai.service');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');

// Validation Schema for AI chat message
const chatMessageSchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1500, 'Message cannot exceed 1500 characters'),
});

/**
 * AI Assistant Controller
 */
const aiController = {
  /**
   * Handle manager conversational Q&A and summary requests
   * @route POST /api/ai/chat
   * @access Authenticated (MANAGER_ADMIN only)
   */
  chat: async (req, res, next) => {
    try {
      const validation = chatMessageSchema.safeParse(req.body);
      if (!validation.success) {
        const errorMessages = validation.error.errors.map((e) => e.message).join(', ');
        return next(ApiError.badRequest(errorMessages));
      }

      const { message } = validation.data;
      const result = await aiService.askAssistant({
        message,
        manager: req.user,
      });

      return ApiResponse.success(res, result, 'AI assistant response generated successfully');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = aiController;

