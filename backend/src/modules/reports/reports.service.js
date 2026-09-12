const { Report, ReportVersion, ReviewHistory } = require('../../models');
const ApiError = require('../../utils/apiError');

// ==========================================
// Reports Service
// Business logic layer — called by controller
// ==========================================

/**
 * Create a new report draft.
 * A team member can only create a report for themselves.
 * Prevents duplicate reports for the same user + project + weekStart.
 *
 * @param {string} userId - The authenticated user's ID
 * @param {object} data - Validated report data from req.body
 * @returns {Promise<Report>}
 */
const createReport = async (userId, data) => {
  const { projectId, weekStart, weekEnd, ...rest } = data;

  // Prevent duplicate: same user + project + weekStart
  const existing = await Report.findOne({
    userId,
    projectId,
    weekStart: new Date(weekStart),
  });
  if (existing) {
    throw ApiError.conflict(
      'A report for this project and week already exists. Please edit the existing report.'
    );
  }

  const report = await Report.create({
    userId,
    projectId,
    weekStart: new Date(weekStart),
    weekEnd: new Date(weekEnd),
    status: 'DRAFT',
    ...rest,
  });

  return report.populate([
    { path: 'userId', select: 'name email avatar' },
    { path: 'projectId', select: 'name category' },
  ]);
};

/**
 * Get all reports.
 * TEAM_MEMBER: only their own reports.
 * MANAGER_ADMIN: all reports, with optional userId filter.
 *
 * @param {{ role, userId, query }} options
 * @returns {Promise<Report[]>}
 */
const getAllReports = async ({ role, userId, query = {} }) => {
  let filter = {};

  if (role === 'TEAM_MEMBER') {
    filter.userId = userId;
  } else if (query.userId) {
    // Manager can filter by a specific team member
    filter.userId = query.userId;
  }

  if (query.projectId) filter.projectId = query.projectId;
  if (query.status) filter.status = query.status;

  // Week range filter
  if (query.weekStart) filter.weekStart = { $gte: new Date(query.weekStart) };
  if (query.weekEnd) filter.weekEnd = { $lte: new Date(query.weekEnd) };

  const reports = await Report.find(filter)
    .populate('userId', 'name email avatar')
    .populate('projectId', 'name category')
    .sort({ weekStart: -1, createdAt: -1 });

  return reports;
};

/**
 * Get a single report by ID.
 * TEAM_MEMBER: can only view their own reports.
 * MANAGER_ADMIN: can view any report.
 *
 * @param {string} reportId
 * @param {{ role, userId }} options
 * @returns {Promise<Report>}
 */
const getReportById = async (reportId, { role, userId }) => {
  const report = await Report.findById(reportId)
    .populate('userId', 'name email avatar')
    .populate('projectId', 'name category');

  if (!report) {
    throw ApiError.notFound('Report not found.');
  }

  if (role === 'TEAM_MEMBER' && report.userId._id.toString() !== userId.toString()) {
    throw ApiError.forbidden('You do not have access to this report.');
  }

  return report;
};

/**
 * Update a report.
 * Only DRAFT or NEEDS_CORRECTION reports can be edited.
 * TEAM_MEMBER: can only edit their own reports.
 * MANAGER_ADMIN: cannot edit reports (only review/approve).
 *
 * @param {string} reportId
 * @param {string} userId
 * @param {object} updates
 * @returns {Promise<Report>}
 */
const updateReport = async (reportId, userId, updates) => {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found.');

  if (report.userId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only edit your own reports.');
  }

  if (report.status === 'SUBMITTED' || report.status === 'APPROVED') {
    throw ApiError.badRequest(
      `A ${report.status.toLowerCase()} report cannot be edited. Withdraw or wait for correction request.`
    );
  }

  Object.assign(report, updates);
  await report.save();

  return report.populate([
    { path: 'userId', select: 'name email avatar' },
    { path: 'projectId', select: 'name category' },
  ]);
};

/**
 * Submit a report for manager review.
 * Only DRAFT or NEEDS_CORRECTION reports can be submitted.
 * Creates a ReportVersion snapshot for audit trail.
 *
 * @param {string} reportId
 * @param {string} userId
 * @returns {Promise<Report>}
 */
const submitReport = async (reportId, userId) => {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found.');

  if (report.userId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only submit your own reports.');
  }

  if (report.status === 'SUBMITTED') {
    throw ApiError.badRequest('This report has already been submitted.');
  }
  if (report.status === 'APPROVED') {
    throw ApiError.badRequest('An approved report cannot be resubmitted.');
  }

  const nextVersion = report.currentVersion + 1;

  // Create version snapshot before changing status
  await ReportVersion.create({
    reportId: report._id,
    versionNumber: nextVersion,
    content: {
      projectId: report.projectId,
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      tasks: report.tasks,
      nextWeekTasks: report.nextWeekTasks,
      blockers: report.blockers,
      achievements: report.achievements,
      hours: report.hours,
      notes: report.notes,
      links: report.links,
    },
    submittedBy: report.userId,
    submittedAt: new Date(),
  });

  // Record submission in review history
  await ReviewHistory.create({
    reportId: report._id,
    reviewerId: userId,
    action: 'SUBMITTED',
    comment: 'Report submitted for review',
    versionNumber: nextVersion,
  });

  report.status = 'SUBMITTED';
  report.submittedAt = new Date();
  report.currentVersion = nextVersion;
  await report.save();

  return report.populate([
    { path: 'userId', select: 'name email avatar' },
    { path: 'projectId', select: 'name category' },
  ]);
};

/**
 * Delete a draft report.
 * Only DRAFT reports can be deleted.
 * TEAM_MEMBER: can only delete their own reports.
 *
 * @param {string} reportId
 * @param {string} userId
 * @param {string} role
 */
const deleteReport = async (reportId, userId, role) => {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found.');

  if (role === 'TEAM_MEMBER' && report.userId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only delete your own reports.');
  }

  if (report.status !== 'DRAFT') {
    throw ApiError.badRequest('Only DRAFT reports can be deleted.');
  }

  await Report.findByIdAndDelete(reportId);
};

/**
 * Get version history for a report.
 *
 * @param {string} reportId
 * @param {{ role, userId }} options
 * @returns {Promise<ReportVersion[]>}
 */
const getReportVersions = async (reportId, { role, userId }) => {
  // First verify user can access this report
  await getReportById(reportId, { role, userId });

  const versions = await ReportVersion.find({ reportId })
    .populate('submittedBy', 'name email avatar')
    .sort({ versionNumber: 1 });
  return versions;
};

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  submitReport,
  deleteReport,
  getReportVersions,
};
