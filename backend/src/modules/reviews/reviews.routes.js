const express = require('express');
const reviewsController = require('./reviews.controller');
const authenticateUser = require('../../middleware/authenticateUser');
const authorizeRoles = require('../../middleware/authorizeRoles');

const router = express.Router();

// All review routes require authentication + MANAGER_ADMIN role
router.use(authenticateUser);
router.use(authorizeRoles('MANAGER_ADMIN'));

// ==========================================
// Manager Review Routes
// ==========================================

/**
 * GET /api/reviews/pending
 * Get all submitted reports waiting for review (manager inbox).
 * IMPORTANT: must be before /:reportId routes to avoid conflict.
 */
router.get('/pending', (req, res, next) => reviewsController.getPendingReports(req, res, next));

/**
 * GET /api/reviews/:reportId/history
 * Get full review audit trail for a specific report.
 */
router.get('/:reportId/history', (req, res, next) =>
  reviewsController.getReviewHistory(req, res, next)
);

/**
 * PATCH /api/reviews/:reportId/approve
 * Approve a submitted report.
 * Body: { comment? }
 */
router.patch('/:reportId/approve', (req, res, next) =>
  reviewsController.approveReport(req, res, next)
);

/**
 * PATCH /api/reviews/:reportId/request-correction
 * Request corrections on a submitted report.
 * Body: { comment (required) }
 */
router.patch('/:reportId/request-correction', (req, res, next) =>
  reviewsController.requestCorrection(req, res, next)
);

module.exports = router;
