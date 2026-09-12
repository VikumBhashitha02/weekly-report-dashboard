const { Project } = require('../../models');
const ApiError = require('../../utils/apiError');

// ==========================================
// Project Service
// Business logic layer — called by controller
// ==========================================

/**
 * Create a new project.
 * Only MANAGER_ADMIN can create projects.
 * @param {{ name, description, category }} data
 * @returns {Promise<Project>}
 */
const createProject = async ({ name, description, category }) => {
  // Check for duplicate project name (case-insensitive)
  const existing = await Project.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (existing) {
    throw ApiError.conflict(`A project named "${name}" already exists.`);
  }

  const project = await Project.create({
    name,
    description: description || '',
    category: category || 'General',
  });

  return project;
};

/**
 * Get all projects with optional filtering.
 * TEAM_MEMBER: sees only active projects they are assigned to.
 * MANAGER_ADMIN: sees all projects (active and inactive).
 * @param {{ role, userId, showInactive }} options
 * @returns {Promise<Project[]>}
 */
const getAllProjects = async ({ role, userId, showInactive = false }) => {
  let filter = {};

  if (role === 'MANAGER_ADMIN') {
    // Managers can optionally filter for inactive projects
    if (!showInactive) {
      filter.isActive = true;
    }
  } else {
    // Team members only see active projects assigned to them
    filter.isActive = true;
    filter.assignedMembers = userId;
  }

  const projects = await Project.find(filter)
    .populate('assignedMembers', 'name email avatar role')
    .sort({ createdAt: -1 });

  return projects;
};

/**
 * Get a single project by ID.
 * TEAM_MEMBER: can only access projects they are assigned to.
 * MANAGER_ADMIN: can access any project.
 * @param {string} projectId
 * @param {{ role, userId }} options
 * @returns {Promise<Project>}
 */
const getProjectById = async (projectId, { role, userId }) => {
  const project = await Project.findById(projectId).populate(
    'assignedMembers',
    'name email avatar role'
  );

  if (!project) {
    throw ApiError.notFound('Project not found.');
  }

  // Team members can only view projects they are assigned to
  if (role === 'TEAM_MEMBER') {
    const isMember = project.assignedMembers.some((m) => m._id.toString() === userId.toString());
    if (!isMember) {
      throw ApiError.forbidden('You do not have access to this project.');
    }
  }

  return project;
};

/**
 * Update project details (name, description, category, isActive).
 * Only MANAGER_ADMIN can update projects.
 * @param {string} projectId
 * @param {{ name, description, category, isActive }} updates
 * @returns {Promise<Project>}
 */
const updateProject = async (projectId, updates) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Project not found.');
  }

  // Check duplicate name only if name is being changed
  if (updates.name && updates.name !== project.name) {
    const duplicate = await Project.findOne({
      name: { $regex: `^${updates.name}$`, $options: 'i' },
      _id: { $ne: projectId },
    });
    if (duplicate) {
      throw ApiError.conflict(`A project named "${updates.name}" already exists.`);
    }
  }

  Object.assign(project, updates);
  await project.save();

  return project.populate('assignedMembers', 'name email avatar role');
};

/**
 * Assign team members to a project.
 * Replaces the current assignedMembers list with the new one.
 * Only MANAGER_ADMIN can assign members.
 * @param {string} projectId
 * @param {string[]} memberIds - Array of User ObjectIds
 * @returns {Promise<Project>}
 */
const assignMembers = async (projectId, memberIds) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Project not found.');
  }

  // Verify all provided IDs exist as active users
  const { User } = require('../../models');
  const users = await User.find({ _id: { $in: memberIds }, isActive: true }).select('_id');
  if (users.length !== memberIds.length) {
    throw ApiError.badRequest('One or more memberIds are invalid or belong to inactive users.');
  }

  project.assignedMembers = memberIds;
  await project.save();

  return project.populate('assignedMembers', 'name email avatar role');
};

/**
 * Delete (permanently) a project by ID.
 * Only MANAGER_ADMIN can delete projects.
 * @param {string} projectId
 */
const deleteProject = async (projectId) => {
  const project = await Project.findByIdAndDelete(projectId);
  if (!project) {
    throw ApiError.notFound('Project not found.');
  }
};

/**
 * Get distinct project categories.
 * Used to populate dropdowns in report forms.
 * @returns {Promise<string[]>}
 */
const getCategories = async () => {
  const categories = await Project.distinct('category', { isActive: true });
  return categories.sort();
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  assignMembers,
  deleteProject,
  getCategories,
};
