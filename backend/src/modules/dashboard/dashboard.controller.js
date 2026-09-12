const dashboardService = require('./dashboard.service');
const ApiResponse = require('../../utils/apiResponse');

// ==========================================
// Dashboard Controller
// ==========================================

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get high-level team stats (user counts, project counts, report status breakdown)
 * @access  MANAGER_ADMIN only
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    return ApiResponse.success(res, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/trend
 * @desc    Get weekly report submission trend for the last N weeks
 * @access  MANAGER_ADMIN only
 * @query   ?weeks=8
 */
const getWeeklySubmissionTrend = async (req, res, next) => {
  try {
    const weeks = parseInt(req.query.weeks, 10) || 8;
    const trend = await dashboardService.getWeeklySubmissionTrend(weeks);
    return ApiResponse.success(res, trend, 'Weekly trend retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/members
 * @desc    Get per-member report submission summary
 * @access  MANAGER_ADMIN only
 */
const getMemberSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getMemberSummary();
    return ApiResponse.success(res, summary, 'Member summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getWeeklySubmissionTrend,
  getMemberSummary,
};
