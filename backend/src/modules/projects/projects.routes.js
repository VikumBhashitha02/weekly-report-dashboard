const express = require('express');
const projectsController = require('./projects.controller');
const { createProjectSchema, updateProjectSchema, assignMembersSchema, validate } = require('./projects.validation');
const authenticateUser = require('../../middleware/authenticateUser');
const authorizeRoles = require('../../middleware/authorizeRoles');

const router = express.Router();

// All project routes require authentication
router.use(authenticateUser);

// ==========================================
// Public to all authenticated users
// ==========================================

/**
 * GET /api/projects
 * Returns all projects (role-filtered).
 */
router.get('/', (req, res, next) => projectsController.getAllProjects(req, res, next));

/**
 * GET /api/projects/categories
 * Returns list of distinct categories from active projects.
 * Must be before /:id to avoid route conflict.
 */
router.get('/categories', (req, res, next) => projectsController.getCategories(req, res, next));

/**
 * GET /api/projects/:id
 * Returns a single project (TEAM_MEMBER restricted to assigned projects).
 */
router.get('/:id', (req, res, next) => projectsController.getProjectById(req, res, next));

// ==========================================
// MANAGER_ADMIN only routes
// ==========================================

/**
 * POST /api/projects
 * Create a new project.
 */
router.post(
  '/',
  authorizeRoles('MANAGER_ADMIN'),
  validate(createProjectSchema),
  (req, res, next) => projectsController.createProject(req, res, next)
);

/**
 * PUT /api/projects/:id
 * Update project details.
 */
router.put(
  '/:id',
  authorizeRoles('MANAGER_ADMIN'),
  validate(updateProjectSchema),
  (req, res, next) => projectsController.updateProject(req, res, next)
);

/**
 * PATCH /api/projects/:id/members
 * Replace the assigned members list on a project.
 */
router.patch(
  '/:id/members',
  authorizeRoles('MANAGER_ADMIN'),
  validate(assignMembersSchema),
  (req, res, next) => projectsController.assignMembers(req, res, next)
);

/**
 * DELETE /api/projects/:id
 * Permanently delete a project.
 */
router.delete(
  '/:id',
  authorizeRoles('MANAGER_ADMIN'),
  (req, res, next) => projectsController.deleteProject(req, res, next)
);

module.exports = router;
