const reportsService = require('./reports.service');
const ApiResponse = require('../../utils/apiResponse');

// ==========================================
// Reports Controller
// Thin layer — delegates all logic to service
// ==========================================

/**
 * @route   POST /api/reports
 * @desc    Create a new report draft
 * @access  TEAM_MEMBER only
 */
const createReport = async (req, res, next) => {
  try {
    const report = await reportsService.createReport(req.user._id, req.body);
    return ApiResponse.created(res, report, 'Report draft created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports
 * @desc    Get all reports (TEAM_MEMBER: own only, MANAGER_ADMIN: all)
 * @access  Authenticated
 */
const getAllReports = async (req, res, next) => {
  try {
    const reports = await reportsService.getAllReports({
      role: req.user.role,
      userId: req.user._id,
      query: req.query,
    });
    return ApiResponse.success(res, reports, 'Reports retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/:id
 * @desc    Get a single report by ID
 * @access  Authenticated (TEAM_MEMBER: own only)
 */
const getReportById = async (req, res, next) => {
  try {
    const report = await reportsService.getReportById(req.params.id, {
      role: req.user.role,
      userId: req.user._id,
    });
    return ApiResponse.success(res, report, 'Report retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/reports/:id
 * @desc    Update a draft report
 * @access  TEAM_MEMBER (own reports only, DRAFT or NEEDS_CORRECTION)
 */
const updateReport = async (req, res, next) => {
  try {
    const report = await reportsService.updateReport(req.params.id, req.user._id, req.body);
    return ApiResponse.success(res, report, 'Report updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/reports/:id/submit
 * @desc    Submit a report for manager review
 * @access  TEAM_MEMBER (own reports only)
 */
const submitReport = async (req, res, next) => {
  try {
    const report = await reportsService.submitReport(req.params.id, req.user._id);
    return ApiResponse.success(res, report, 'Report submitted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete a draft report
 * @access  TEAM_MEMBER (own DRAFT reports only)
 */
const deleteReport = async (req, res, next) => {
  try {
    await reportsService.deleteReport(req.params.id, req.user._id, req.user.role);
    return ApiResponse.success(res, null, 'Report deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/:id/versions
 * @desc    Get version history for a report
 * @access  Authenticated (TEAM_MEMBER: own only)
 */
const getReportVersions = async (req, res, next) => {
  try {
    const versions = await reportsService.getReportVersions(req.params.id, {
      role: req.user.role,
      userId: req.user._id,
    });
    return ApiResponse.success(res, versions, 'Report versions retrieved successfully');
  } catch (error) {
    next(error);
  }
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
