const projectsService = require('./projects.service');
const ApiResponse = require('../../utils/apiResponse');

// ==========================================
// Projects Controller
// Thin layer — delegates all logic to service
// ==========================================

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  MANAGER_ADMIN only
 */
const createProject = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;
    const project = await projectsService.createProject({ name, description, category });
    return ApiResponse.created(res, project, 'Project created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/projects
 * @desc    Get all projects (role-filtered)
 * @access  Authenticated (TEAM_MEMBER sees assigned only, MANAGER_ADMIN sees all)
 */
const getAllProjects = async (req, res, next) => {
  try {
    const showInactive = req.query.showInactive === 'true';
    const projects = await projectsService.getAllProjects({
      role: req.user.role,
      userId: req.user._id,
      showInactive,
    });
    return ApiResponse.success(res, projects, 'Projects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/projects/categories
 * @desc    Get distinct list of active project categories
 * @access  Authenticated
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await projectsService.getCategories();
    return ApiResponse.success(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Authenticated (TEAM_MEMBER must be assigned member)
 */
const getProjectById = async (req, res, next) => {
  try {
    const project = await projectsService.getProjectById(req.params.id, {
      role: req.user.role,
      userId: req.user._id,
    });
    return ApiResponse.success(res, project, 'Project retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  MANAGER_ADMIN only
 */
const updateProject = async (req, res, next) => {
  try {
    const project = await projectsService.updateProject(req.params.id, req.body);
    return ApiResponse.success(res, project, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/projects/:id/members
 * @desc    Assign (replace) team members on a project
 * @access  MANAGER_ADMIN only
 */
const assignMembers = async (req, res, next) => {
  try {
    const project = await projectsService.assignMembers(req.params.id, req.body.memberIds);
    return ApiResponse.success(res, project, 'Members assigned successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/projects/:id
 * @desc    Permanently delete a project
 * @access  MANAGER_ADMIN only
 */
const deleteProject = async (req, res, next) => {
  try {
    await projectsService.deleteProject(req.params.id);
    return ApiResponse.success(res, null, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getCategories,
  getProjectById,
  updateProject,
  assignMembers,
  deleteProject,
};
