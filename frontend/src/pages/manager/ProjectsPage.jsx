import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  Users,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FolderPlus,
  UserCheck,
  Layers,
  Archive,
} from 'lucide-react';
import projectService from '../../services/projectService';
import userService from '../../services/userService';
import PageLoader from '../../components/ui/PageLoader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ButtonSpinner from '../../components/ui/ButtonSpinner';
import { useToast } from '../../hooks/useToast';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  // Create / Edit Modal State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', description: '', isActive: true });
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Assign Members Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [targetProjectForMembers, setTargetProjectForMembers] = useState(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Delete Confirm State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);

  const { success: toastSuccess, error: toastError } = useToast();

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [projRes, catRes, usersRes] = await Promise.all([
        projectService.getProjects({ showInactive: true }),
        projectService.getCategories().catch(() => ({ data: [] })),
        userService.getUsers({ isActive: true }).catch(() => ({ data: [] })),
      ]);

      setProjects(projRes?.data || []);
      setCategories(catRes?.data || []);
      setAllUsers(usersRes?.data || []);
    } catch (err) {
      const msg = err.message || 'Failed to load projects.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q);

    const matchesCategory =
      categoryFilter === 'ALL' || p.category === categoryFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.isActive) ||
      (statusFilter === 'INACTIVE' && !p.isActive);

    return matchesQuery && matchesCategory && matchesStatus;
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({ name: '', category: 'General', description: '', isActive: true });
    setFormError('');
    setShowProjectModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      category: project.category || 'General',
      description: project.description || '',
      isActive: project.isActive ?? true,
    });
    setFormError('');
    setShowProjectModal(true);
  };

  // Submit Create or Edit
  const handleSaveProject = async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      setFormError('Project name is required.');
      return;
    }

    setFormError('');
    setActionLoading(true);
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject._id, {
          name,
          category: formData.category.trim() || 'General',
          description: formData.description.trim(),
          isActive: formData.isActive,
        });
        toastSuccess('Project updated successfully.');
      } else {
        await projectService.createProject({
          name,
          category: formData.category.trim() || 'General',
          description: formData.description.trim(),
        });
        toastSuccess('Project created successfully.');
      }

      setShowProjectModal(false);
      await loadData(true);
    } catch (err) {
      setFormError(err.message || 'Failed to save project.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Member Assignment Modal
  const handleOpenMembers = (project) => {
    setTargetProjectForMembers(project);
    setSelectedMemberIds((project.assignedMembers || []).map((m) => m._id || m));
    setMemberSearchQuery('');
    setShowMemberModal(true);
  };

  // Save Assigned Members
  const handleSaveMembers = async () => {
    if (!targetProjectForMembers) return;
    setActionLoading(true);
    try {
      await projectService.assignMembers(targetProjectForMembers._id, selectedMemberIds);
      toastSuccess('Project team members updated.');
      setShowMemberModal(false);
      await loadData(true);
    } catch (err) {
      toastError(err.message || 'Failed to update assigned members.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle member selection
  const handleToggleMember = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Delete Project
  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    setActionLoading(true);
    try {
      await projectService.deleteProject(deletingProject._id);
      toastSuccess('Project deleted permanently.');
      setShowDeleteConfirm(false);
      setDeletingProject(null);
      await loadData(true);
    } catch (err) {
      toastError(err.message || 'Failed to delete project.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading project management directory..." />;
  }

  if (error && projects.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <ErrorMessage message={error} title="Project Directory Error" />
        <button
          onClick={() => loadData()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Filter available users for assignment modal
  const filteredUsersForModal = allUsers.filter((u) => {
    const q = memberSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ==========================================
          HEADER BAR
      ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Project Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold">
              {projects.length} total
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Create projects, manage category classifications, and allocate team members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-2"
            title="Refresh projects"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-brand-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          SEARCH & FILTERS
      ========================================== */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div className="sm:w-40">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* ==========================================
          PROJECTS DIRECTORY
      ========================================== */}
      {projects.length === 0 ? (
        <div className="py-16">
          <EmptyState
            icon={FolderPlus}
            title="No Projects Found"
            description="Get started by creating your team's first project."
          />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <p className="text-sm text-slate-400">No projects match the current filter criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="mt-3 text-xs text-brand-400 hover:text-brand-300 font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const memberCount = (project.assignedMembers || []).length;

            return (
              <div
                key={project._id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all space-y-4 shadow-lg shadow-black/10 ${
                  project.isActive
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/60 border-slate-900 opacity-75'
                }`}
              >
                {/* Top: Name, Category, Active Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-white text-base tracking-tight truncate">
                        {project.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                        project.isActive
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {project.isActive ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  {project.category && (
                    <span className="inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-brand-300 border border-slate-700">
                      {project.category}
                    </span>
                  )}

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[2rem]">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                {/* Assigned Members & Controls */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                      <span>{memberCount} assigned member(s)</span>
                    </span>

                    {/* Member Avatars Stack */}
                    {memberCount > 0 && (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {(project.assignedMembers || []).slice(0, 3).map((m, idx) => (
                          <div
                            key={m._id || idx}
                            title={m.name || m.email}
                            className="w-5 h-5 rounded-full bg-slate-800 border border-slate-900 text-[9px] font-bold text-slate-200 flex items-center justify-center shrink-0"
                          >
                            {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        ))}
                        {memberCount > 3 && (
                          <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-900 text-[8px] font-bold text-slate-400 flex items-center justify-center shrink-0">
                            +{memberCount - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenMembers(project)}
                      className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Team</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(project)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeletingProject(project);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==========================================
          MODAL: CREATE / EDIT PROJECT
      ========================================== */}
      {showProjectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h3>
              </div>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Project Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Banking Platform"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Category / Classification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fintech, Infrastructure, Internal Tools"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Key project goals, scope, or client information..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Active Toggle (Edit mode only) */}
              {editingProject && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="isActiveToggle" className="text-xs font-medium text-slate-300 cursor-pointer">
                    Project is Active and visible to assigned team members
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-brand-600/20 flex items-center gap-2"
                >
                  {actionLoading && <ButtonSpinner />}
                  <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ASSIGN TEAM MEMBERS
      ========================================== */}
      {showMemberModal && targetProjectForMembers && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Assign Team Members</h3>
                  <p className="text-xs text-slate-400">
                    Project: <strong className="text-slate-200">{targetProjectForMembers.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Member Search */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter members by name or email..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Selection Quick Buttons */}
            <div className="flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>{selectedMemberIds.length} member(s) selected</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberIds(allUsers.map((u) => u._id))}
                  className="text-teal-400 hover:text-teal-300 font-medium"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setSelectedMemberIds([])}
                  className="text-slate-400 hover:text-slate-200 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Members Checkbox List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredUsersForModal.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6 italic">
                  No active members found matching query.
                </p>
              ) : (
                filteredUsersForModal.map((user) => {
                  const isChecked = selectedMemberIds.includes(user._id);

                  return (
                    <label
                      key={user._id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-teal-500/10 border-teal-500/40 text-teal-100'
                          : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs">{user.name}</div>
                          <div className="text-[11px] text-slate-400">{user.email}</div>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMember(user._id)}
                        className="w-4 h-4 rounded text-teal-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                      />
                    </label>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveMembers}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2"
              >
                {actionLoading && <ButtonSpinner />}
                <span>Save Member Allocation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CONFIRM DELETE PROJECT
      ========================================== */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Project Permanently?"
        message={`Are you sure you want to delete project "${deletingProject?.name}"? This action cannot be undone.`}
        confirmText="Delete Project"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleDeleteProject}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingProject(null);
        }}
      />
    </div>
  );
}
