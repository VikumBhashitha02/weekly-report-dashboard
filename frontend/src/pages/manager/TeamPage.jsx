import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  Calendar,
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import userService from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import PageLoader from '../../components/ui/PageLoader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Avatar from '../../components/ui/Avatar';

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Deactivate / Reactivate Modal State
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const loadUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await userService.getUsers();
      setUsers(res?.data || []);
    } catch (err) {
      const msg = err.message || 'Failed to load team member directory.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive) ||
      (statusFilter === 'INACTIVE' && !u.isActive);

    return matchesQuery && matchesRole && matchesStatus;
  });

  // Handle Deactivate
  const handleDeactivateUser = async () => {
    if (!targetUser) return;
    setActionLoading(true);
    try {
      await userService.deactivateUser(targetUser._id);
      toastSuccess(`User ${targetUser.name || targetUser.email} has been deactivated.`);
      setShowDeactivateConfirm(false);
      setTargetUser(null);
      await loadUsers(true);
    } catch (err) {
      toastError(err.message || 'Failed to deactivate user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reactivate
  const handleReactivateUser = async () => {
    if (!targetUser) return;
    setActionLoading(true);
    try {
      await userService.reactivateUser(targetUser._id);
      toastSuccess(`User ${targetUser.name || targetUser.email} has been reactivated.`);
      setShowReactivateConfirm(false);
      setTargetUser(null);
      await loadUsers(true);
    } catch (err) {
      toastError(err.message || 'Failed to reactivate user.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading team member directory..." />;
  }

  if (error && users.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <ErrorMessage message={error} title="Directory Error" />
        <button
          onClick={() => loadUsers()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalMembers = users.filter((u) => u.role === 'TEAM_MEMBER').length;
  const totalManagers = users.filter((u) => u.role === 'MANAGER_ADMIN').length;
  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ==========================================
          HEADER BAR & STATS
      ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Team Directory & Access
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-bold">
              {users.length} accounts
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Directory of team members, managers, and account activation statuses.
          </p>
        </div>

        <button
          onClick={() => loadUsers(true)}
          disabled={refreshing}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-2"
          title="Refresh team directory"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* ==========================================
          QUICK METRICS
      ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Team Members
            </span>
            <p className="text-2xl font-bold text-white mt-0.5">{totalMembers}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Managers / Admins
            </span>
            <p className="text-2xl font-bold text-purple-300 mt-0.5">{totalManagers}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Accounts
            </span>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">
              {activeCount} <span className="text-xs text-slate-500">/ {users.length}</span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
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
            placeholder="Search team directory by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Role Filter */}
        <div className="sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Roles</option>
            <option value="TEAM_MEMBER">Team Members</option>
            <option value="MANAGER_ADMIN">Managers / Admins</option>
          </select>
        </div>

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
          USERS DIRECTORY TABLE
      ========================================== */}
      {users.length === 0 ? (
        <div className="py-16">
          <EmptyState
            icon={Users}
            title="No Users Found"
            description="The team member directory is currently empty."
          />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <p className="text-sm text-slate-400">No team members match the search filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="mt-3 text-xs text-brand-400 hover:text-brand-300 font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((user) => {
                  const isSelf = currentUser?._id === user._id;

                  return (
                    <tr
                      key={user._id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !user.isActive ? 'opacity-60 bg-slate-950/30' : ''
                      }`}
                    >
                      {/* Member Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            size="sm"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">
                                {user.name || 'Unnamed'}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>


                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                            user.role === 'MANAGER_ADMIN'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Active Status Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            user.isActive
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.isActive ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span>{user.isActive ? 'Active' : 'Deactivated'}</span>
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-slate-400">
                        {user.createdAt ? (
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        {isSelf ? (
                          <span className="text-slate-500 text-[11px] italic">
                            Cannot modify self
                          </span>
                        ) : user.isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUser(user);
                              setShowDeactivateConfirm(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUser(user);
                              setShowReactivateConfirm(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: DEACTIVATE USER CONFIRMATION
      ========================================== */}
      <ConfirmDialog
        isOpen={showDeactivateConfirm}
        title={`Deactivate ${targetUser?.name || targetUser?.email}?`}
        message="Deactivating this user will revoke their session and prevent them from logging in or submitting reports."
        confirmText="Confirm Deactivation"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleDeactivateUser}
        onCancel={() => {
          setShowDeactivateConfirm(false);
          setTargetUser(null);
        }}
      />

      {/* ==========================================
          MODAL: REACTIVATE USER CONFIRMATION
      ========================================== */}
      <ConfirmDialog
        isOpen={showReactivateConfirm}
        title={`Reactivate ${targetUser?.name || targetUser?.email}?`}
        message="Reactivating this user account will restore their login access and allow them to create and submit weekly reports."
        confirmText="Confirm Reactivation"
        isDestructive={false}
        loading={actionLoading}
        onConfirm={handleReactivateUser}
        onCancel={() => {
          setShowReactivateConfirm(false);
          setTargetUser(null);
        }}
      />
    </div>
  );
}
