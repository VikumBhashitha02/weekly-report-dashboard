const { Report, ReviewHistory } = require('../../models');
const ApiError = require('../../utils/apiError');

// ==========================================
// Reviews Service
// MANAGER_ADMIN review workflow:
//   SUBMITTED → APPROVED
//   SUBMITTED → NEEDS_CORRECTION
// ==========================================

/**
 * Approve a submitted report.
 * Sets status to APPROVED and records review history.
 *
 * @param {string} reportId
 * @param {string} reviewerId - MANAGER_ADMIN's userId
 * @param {string} comment - Optional approval comment
 * @returns {Promise<Report>}
 */
const approveReport = async (reportId, reviewerId, comment = '') => {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found.');

  if (report.status !== 'SUBMITTED') {
    throw ApiError.badRequest(
      `Only SUBMITTED reports can be approved. Current status: ${report.status}.`
    );
  }

  // Record review history entry
  await ReviewHistory.create({
    reportId: report._id,
    reviewerId,
    action: 'APPROVED',
    comment,
    versionNumber: report.currentVersion,
  });

  // Update report status
  report.status = 'APPROVED';
  report.approvedAt = new Date();
  report.latestReviewComment = comment || null;
  await report.save();

  return report.populate([
    { path: 'userId', select: 'name email avatar' },
    { path: 'projectId', select: 'name category' },
  ]);
};

/**
 * Request corrections on a submitted report.
 * Sets status to NEEDS_CORRECTION and provides feedback comment.
 *
 * @param {string} reportId
 * @param {string} reviewerId - MANAGER_ADMIN's userId
 * @param {string} comment - Required correction instructions
 * @returns {Promise<Report>}
 */
const requestCorrection = async (reportId, reviewerId, comment) => {
  if (!comment || !comment.trim()) {
    throw ApiError.badRequest('A correction comment is required when requesting changes.');
  }

  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found.');

  if (report.status !== 'SUBMITTED') {
    throw ApiError.badRequest(
      `Only SUBMITTED reports can receive correction requests. Current status: ${report.status}.`
    );
  }

  // Record review history entry
  await ReviewHistory.create({
    reportId: report._id,
    reviewerId,
    action: 'REQUESTED_CHANGES',
    comment,
    versionNumber: report.currentVersion,
  });

  // Update report status and store the latest comment for easy display
  report.status = 'NEEDS_CORRECTION';
  report.latestReviewComment = comment;
  await report.save();

  return report.populate([
    { path: 'userId', select: 'name email avatar' },
    { path: 'projectId', select: 'name category' },
  ]);
};

/**
 * Get full review history (audit trail) for a report.
 *
 * @param {string} reportId
 * @returns {Promise<ReviewHistory[]>}
 */
const getReviewHistory = async (reportId) => {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found.');

  const history = await ReviewHistory.find({ reportId })
    .populate('reviewerId', 'name email avatar')
    .sort({ createdAt: 1 });

  return history;
};

/**
 * Get all submitted reports pending review.
 * MANAGER_ADMIN use case — dashboard inbox.
 *
 * @returns {Promise<Report[]>}
 */
const getPendingReports = async () => {
  const reports = await Report.find({ status: 'SUBMITTED' })
    .populate('userId', 'name email avatar')
    .populate('projectId', 'name category')
    .sort({ submittedAt: 1 }); // Oldest submitted first

  return reports;
};

module.exports = {
  approveReport,
  requestCorrection,
  getReviewHistory,
  getPendingReports,
};
