import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  Send,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import reportService from '../../services/reportService';
import projectService from '../../services/projectService';
import { useToast } from '../../hooks/useToast';
import ReportStatusBadge from '../../components/reports/ReportStatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ButtonSpinner from '../../components/ui/ButtonSpinner';

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Modals State
  const [submitReportTarget, setSubmitReportTarget] = useState(null);
  const [deleteReportTarget, setDeleteReportTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  // Load Reports and Assigned Projects
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsRes, projectsRes] = await Promise.all([
        reportService.getReports(),
        projectService.getProjects(),
      ]);

      setReports(reportsRes?.data || []);
      setProjects(projectsRes?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load your weekly reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Date formatter
  const formatDateRange = (startStr, endStr) => {
    if (!startStr || !endStr) return 'N/A';
    const s = new Date(startStr);
    const e = new Date(endStr);
    const sFormatted = s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const eFormatted = e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${sFormatted} – ${eFormatted}`;
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = reports.length;
    const submitted = reports.filter((r) => r.status === 'SUBMITTED').length;
    const needsCorrection = reports.filter((r) => r.status === 'NEEDS_CORRECTION').length;
    const approved = reports.filter((r) => r.status === 'APPROVED').length;
    const drafts = reports.filter((r) => r.status === 'DRAFT').length;
    return { total, submitted, needsCorrection, approved, drafts };
  }, [reports]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Status Filter
      if (statusFilter !== 'ALL' && report.status !== statusFilter) {
        return false;
      }
      // Project Filter
      if (projectFilter !== 'ALL') {
        const pId = report.projectId?._id || report.projectId;
        if (pId !== projectFilter) return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const projName = (report.projectId?.name || '').toLowerCase();
        const notes = (report.notes || '').toLowerCase();
        const taskNames = (report.tasks || []).map((t) => t.taskName.toLowerCase()).join(' ');

        if (!projName.includes(q) && !notes.includes(q) && !taskNames.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [reports, statusFilter, projectFilter, searchQuery]);

  // Handle Submit Report Confirmation
  const handleConfirmSubmit = async () => {
    if (!submitReportTarget) return;
    setActionLoading(true);
    try {
      await reportService.submitReport(submitReportTarget._id);
      toastSuccess('Report submitted successfully! Your manager has been notified.');
      setSubmitReportTarget(null);
      await loadData();
    } catch (err) {
      toastError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Draft Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteReportTarget) return;
    setActionLoading(true);
    try {
      await reportService.deleteReport(deleteReportTarget._id);
      toastSuccess('Draft report deleted.');
      setDeleteReportTarget(null);
      await loadData();
    } catch (err) {
      toastError(err.message || 'Failed to delete report.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ==========================================
          HEADER BAR
      ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            My Weekly Reports
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Log sprint achievements, document weekly progress, and track manager reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
            title="Refresh list"
            aria-label="Refresh reports list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/reports/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Report</span>
          </Link>
        </div>
      </div>

      {/* ==========================================
          STATS OVERVIEW CARDS
      ========================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reports</span>
            <FileText className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">{stats.drafts} drafts saved</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Review</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-sky-300">{stats.submitted}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting approval</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Needs Action</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300">{stats.needsCorrection}</p>
          <span className="text-[11px] text-amber-400/80 mt-1 block font-medium">Corrections requested</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-300">{stats.approved}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Completed & verified</span>
        </div>
      </div>

      {/* ==========================================
          FILTER & SEARCH TOOLBAR
      ========================================== */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by project or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full">
            {['ALL', 'DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {st === 'ALL'
                  ? 'All'
                  : st === 'NEEDS_CORRECTION'
                  ? 'Correction'
                  : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Project Filter */}
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorMessage
          message={error}
          title="Error Loading Reports"
          onDismiss={() => setError(null)}
        />
      )}

      {/* ==========================================
          REPORTS LIST VIEW
      ========================================== */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-48 h-4 bg-slate-800 rounded" />
                <div className="w-24 h-6 bg-slate-800 rounded-full" />
              </div>
              <div className="w-72 h-3 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={reports.length === 0 ? 'No weekly reports yet' : 'No matching reports'}
          description={
            reports.length === 0
              ? 'Get started by creating your first weekly progress report to log accomplishments and tasks.'
              : 'Try clearing your search query or selecting a different status filter.'
          }
          action={
            reports.length === 0 ? (
              <Link
                to="/reports/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/25 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Weekly Report</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setProjectFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                Reset Filters
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isDraft = report.status === 'DRAFT';
            const isNeedsCorrection = report.status === 'NEEDS_CORRECTION';
            const isSubmitted = report.status === 'SUBMITTED';
            const isApproved = report.status === 'APPROVED';

            const totalHours = (report.hours || []).reduce((acc, h) => acc + (h.hours || 0), 0);
            const completedTasks = (report.tasks || []).filter((t) => t.status === 'COMPLETED').length;

            return (
              <div
                key={report._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all backdrop-blur-sm space-y-4 shadow-lg shadow-black/20"
              >
                {/* Top Row: Dates, Project, Status, Version */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                      <Calendar className="w-4 h-4 text-brand-400" />
                      {formatDateRange(report.weekStart, report.weekEnd)}
                    </span>

                    <span className="text-slate-600">•</span>

                    <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700/60">
                      {report.projectId?.name || 'Assigned Project'}
                    </span>

                    {report.currentVersion > 0 && (
                      <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                        v{report.currentVersion}
                      </span>
                    )}
                  </div>

                  <ReportStatusBadge status={report.status} />
                </div>

                {/* Manager Review Comment Callout (If NEEDS_CORRECTION) */}
                {isNeedsCorrection && report.latestReviewComment && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-300 mb-0.5">Manager Feedback & Correction Required:</p>
                      <p className="text-amber-200/90 leading-relaxed italic">"{report.latestReviewComment}"</p>
                    </div>
                  </div>
                )}

                {/* Middle Metrics Badges */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      <strong className="text-slate-200 font-semibold">{completedTasks}</strong> /{' '}
                      {report.tasks?.length || 0} tasks done
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>
                      <strong className="text-slate-200 font-semibold">{totalHours}</strong> hrs logged
                    </span>
                  </div>

                  {report.blockers?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{report.blockers.length} blocker(s)</span>
                    </div>
                  )}

                  {report.submittedAt && (
                    <span className="text-[11px] text-slate-500 ml-auto hidden md:inline">
                      Submitted on {new Date(report.submittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Bottom Row: Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <Link
                    to={`/reports/${report._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <span>View Report Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {/* Delete Draft Action */}
                    {isDraft && (
                      <button
                        onClick={() => setDeleteReportTarget(report)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                        title="Delete draft report"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}

                    {/* Edit Action (Allowed for DRAFT or NEEDS_CORRECTION) */}
                    {(isDraft || isNeedsCorrection) && (
                      <Link
                        to={`/reports/${report._id}/edit`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isNeedsCorrection ? 'Revise & Edit' : 'Edit'}</span>
                      </Link>
                    )}

                    {/* Submit Action (Allowed for DRAFT or NEEDS_CORRECTION) */}
                    {(isDraft || isNeedsCorrection) && (
                      <button
                        onClick={() => setSubmitReportTarget(report)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isNeedsCorrection ? 'Resubmit' : 'Submit'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Submitting Report */}
      <ConfirmDialog
        isOpen={!!submitReportTarget}
        title="Submit Weekly Report for Review?"
        message="Your weekly report will be submitted to the manager review queue. An immutable version snapshot will be saved."
        confirmText="Confirm & Submit"
        loading={actionLoading}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmitReportTarget(null)}
      />

      {/* Confirmation Modal for Deleting Draft */}
      <ConfirmDialog
        isOpen={!!deleteReportTarget}
        title="Delete Draft Report?"
        message="Are you sure you want to delete this draft? This action cannot be undone."
        confirmText="Delete Draft"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteReportTarget(null)}
      />
    </div>
  );
}
