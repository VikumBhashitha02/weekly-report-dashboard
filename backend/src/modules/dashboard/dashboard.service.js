const { Report, User, Project } = require('../../models');

// ==========================================
// Dashboard Service
// Analytics and summary data for MANAGER_ADMIN
// ==========================================

/**
 * Get top-level team dashboard statistics.
 * Provides counts, status breakdowns, and recent activity.
 *
 * @returns {Promise<object>}
 */
const getDashboardStats = async () => {
  const [
    totalUsers,
    activeUsers,
    totalProjects,
    activeProjects,
    totalReports,
    reportsByStatus,
    recentSubmissions,
  ] = await Promise.all([
    // User counts
    User.countDocuments(),
    User.countDocuments({ isActive: true }),

    // Project counts
    Project.countDocuments(),
    Project.countDocuments({ isActive: true }),

    // Report counts
    Report.countDocuments(),

    // Reports grouped by status
    Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // 5 most recently submitted reports
    Report.find({ status: { $in: ['SUBMITTED', 'NEEDS_CORRECTION'] } })
      .populate('userId', 'name email avatar')
      .populate('projectId', 'name category')
      .sort({ submittedAt: -1 })
      .limit(5),
  ]);

  // Normalize status counts into an easy-to-consume object
  const statusCounts = {
    DRAFT: 0,
    SUBMITTED: 0,
    NEEDS_CORRECTION: 0,
    APPROVED: 0,
  };
  reportsByStatus.forEach(({ _id, count }) => {
    if (statusCounts.hasOwnProperty(_id)) {
      statusCounts[_id] = count;
    }
  });

  return {
    users: { total: totalUsers, active: activeUsers },
    projects: { total: totalProjects, active: activeProjects },
    reports: { total: totalReports, byStatus: statusCounts },
    recentPendingReports: recentSubmissions,
  };
};

/**
 * Get weekly report submission trend for the last N weeks.
 * Used for the reports-over-time chart in the dashboard.
 *
 * @param {number} weeks - Number of weeks to look back (default 8)
 * @returns {Promise<object[]>}
 */
const getWeeklySubmissionTrend = async (weeks = 8) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const trend = await Report.aggregate([
    {
      $match: {
        weekStart: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$weekStart' },
          week: { $isoWeek: '$weekStart' },
        },
        total: { $sum: 1 },
        approved: {
          $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] },
        },
        submitted: {
          $sum: { $cond: [{ $eq: ['$status', 'SUBMITTED'] }, 1, 0] },
        },
        needsCorrection: {
          $sum: { $cond: [{ $eq: ['$status', 'NEEDS_CORRECTION'] }, 1, 0] },
        },
        draft: {
          $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] },
        },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.week': 1 },
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        week: '$_id.week',
        label: {
          $concat: ['W', { $toString: '$_id.week' }, ' ', { $toString: '$_id.year' }],
        },
        total: 1,
        approved: 1,
        submitted: 1,
        needsCorrection: 1,
        draft: 1,
      },
    },
  ]);

  return trend;
};

/**
 * Get per-member report submission summary.
 * Shows how many reports each active user has submitted vs approved.
 *
 * @returns {Promise<object[]>}
 */
const getMemberSummary = async () => {
  const summary = await Report.aggregate([
    {
      $group: {
        _id: '$userId',
        totalReports: { $sum: 1 },
        approvedReports: {
          $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] },
        },
        submittedReports: {
          $sum: { $cond: [{ $eq: ['$status', 'SUBMITTED'] }, 1, 0] },
        },
        draftReports: {
          $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] },
        },
        needsCorrectionReports: {
          $sum: { $cond: [{ $eq: ['$status', 'NEEDS_CORRECTION'] }, 1, 0] },
        },
        lastReportDate: { $max: '$weekStart' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        avatar: '$user.avatar',
        role: '$user.role',
        totalReports: 1,
        approvedReports: 1,
        submittedReports: 1,
        draftReports: 1,
        needsCorrectionReports: 1,
        lastReportDate: 1,
      },
    },
    { $sort: { totalReports: -1 } },
  ]);

  return summary;
};

module.exports = {
  getDashboardStats,
  getWeeklySubmissionTrend,
  getMemberSummary,
};
