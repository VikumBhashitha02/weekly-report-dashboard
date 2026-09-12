const express = require('express');
const reportsController = require('./reports.controller');
const { createReportSchema, updateReportSchema, validate } = require('./reports.validation');
const authenticateUser = require('../../middleware/authenticateUser');
const authorizeRoles = require('../../middleware/authorizeRoles');

const router = express.Router();

// All report routes require authentication
router.use(authenticateUser);

// ==========================================
// Routes accessible to both roles
// ==========================================

/**
 * GET /api/reports
 * TEAM_MEMBER: returns their own reports.
 * MANAGER_ADMIN: returns all reports (filterable via query params).
 * Query params: ?userId=&projectId=&status=&weekStart=&weekEnd=
 */
router.get('/', (req, res, next) => reportsController.getAllReports(req, res, next));

/**
 * GET /api/reports/:id
 * TEAM_MEMBER: own reports only.
 * MANAGER_ADMIN: any report.
 */
router.get('/:id', (req, res, next) => reportsController.getReportById(req, res, next));

/**
 * GET /api/reports/:id/versions
 * Returns the version history snapshots of a report.
 */
router.get('/:id/versions', (req, res, next) => reportsController.getReportVersions(req, res, next));

// ==========================================
// TEAM_MEMBER-only routes
// ==========================================

/**
 * POST /api/reports
 * Create a new report draft.
 */
router.post(
  '/',
  authorizeRoles('TEAM_MEMBER'),
  validate(createReportSchema),
  (req, res, next) => reportsController.createReport(req, res, next)
);

/**
 * PUT /api/reports/:id
 * Update an existing draft (DRAFT or NEEDS_CORRECTION only).
 */
router.put(
  '/:id',
  authorizeRoles('TEAM_MEMBER'),
  validate(updateReportSchema),
  (req, res, next) => reportsController.updateReport(req, res, next)
);

/**
 * PATCH /api/reports/:id/submit
 * Submit a report for manager review.
 */
router.patch(
  '/:id/submit',
  authorizeRoles('TEAM_MEMBER'),
  (req, res, next) => reportsController.submitReport(req, res, next)
);

/**
 * DELETE /api/reports/:id
 * Delete a draft report.
 */
router.delete(
  '/:id',
  authorizeRoles('TEAM_MEMBER'),
  (req, res, next) => reportsController.deleteReport(req, res, next)
);

module.exports = router;
