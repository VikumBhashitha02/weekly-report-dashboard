const express = require('express');
const dashboardController = require('./dashboard.controller');
const authenticateUser = require('../../middleware/authenticateUser');
const authorizeRoles = require('../../middleware/authorizeRoles');

const router = express.Router();

// All dashboard routes require MANAGER_ADMIN role
router.use(authenticateUser);
router.use(authorizeRoles('MANAGER_ADMIN'));

/**
 * GET /api/dashboard/stats
 * Overall team stats: users, projects, report status breakdown, recent pending.
 */
router.get('/stats', (req, res, next) => dashboardController.getDashboardStats(req, res, next));

/**
 * GET /api/dashboard/trend
 * Weekly report submission trend for charts. ?weeks=8
 */
router.get('/trend', (req, res, next) =>
  dashboardController.getWeeklySubmissionTrend(req, res, next)
);

/**
 * GET /api/dashboard/members
 * Per-member report activity summary table.
 */
router.get('/members', (req, res, next) =>
  dashboardController.getMemberSummary(req, res, next)
);

module.exports = router;
