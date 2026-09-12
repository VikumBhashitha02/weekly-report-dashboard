const reviewsService = require('./reviews.service');
const ApiResponse = require('../../utils/apiResponse');

// ==========================================
// Reviews Controller
// ==========================================

/**
 * @route   PATCH /api/reviews/:reportId/approve
 * @desc    Approve a submitted report
 * @access  MANAGER_ADMIN only
 */
const approveReport = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const report = await reviewsService.approveReport(req.params.reportId, req.user._id, comment);
    return ApiResponse.success(res, report, 'Report approved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/reviews/:reportId/request-correction
 * @desc    Request corrections on a submitted report
 * @access  MANAGER_ADMIN only
 */
const requestCorrection = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const report = await reviewsService.requestCorrection(
      req.params.reportId,
      req.user._id,
      comment
    );
    return ApiResponse.success(res, report, 'Correction requested successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/:reportId/history
 * @desc    Get full audit trail (review history) for a report
 * @access  MANAGER_ADMIN only
 */
const getReviewHistory = async (req, res, next) => {
  try {
    const history = await reviewsService.getReviewHistory(req.params.reportId);
    return ApiResponse.success(res, history, 'Review history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/pending
 * @desc    Get all submitted reports pending review (manager inbox)
 * @access  MANAGER_ADMIN only
 */
const getPendingReports = async (req, res, next) => {
  try {
    const reports = await reviewsService.getPendingReports();
    return ApiResponse.success(res, reports, 'Pending reports retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveReport,
  requestCorrection,
  getReviewHistory,
  getPendingReports,
};
