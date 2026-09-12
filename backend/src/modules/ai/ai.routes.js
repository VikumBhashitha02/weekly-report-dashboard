const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');
const authenticateUser = require('../../middleware/authenticateUser');
const authorizeRoles = require('../../middleware/authorizeRoles');

/**
 * @route   POST /api/ai/chat
 * @desc    Send a question or summary prompt to the Gemini AI Management Assistant
 * @access  Private (MANAGER_ADMIN only)
 */
router.post('/chat', authenticateUser, authorizeRoles('MANAGER_ADMIN'), aiController.chat);

module.exports = router;

