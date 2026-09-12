import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Calendar,
  FolderGit2,
  Clock,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  User,
} from 'lucide-react';
import reviewService from '../../services/reviewService';
import ReportStatusBadge from '../../components/reports/ReportStatusBadge';
import PageLoader from '../../components/ui/PageLoader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../hooks/useToast';

export default function ReviewInboxPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');

  const { error: toastError } = useToast();

  const loadPendingReports = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await reviewService.getPendingReports();
      setReports(res?.data || []);
    } catch (err) {
      const msg = err.message || 'Failed to load pending reviews.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadPendingReports();
  }, [loadPendingReports]);

  // Distinct projects for filter dropdown
  const uniqueProjects = Array.from(
    new Set(reports.map((r) => r.projectId?.name).filter(Boolean))
  ).sort();

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      r.userId?.name?.toLowerCase().includes(q) ||
      r.userId?.email?.toLowerCase().includes(q) ||
      r.projectId?.name?.toLowerCase().includes(q);

    const matchesProject =
      selectedProject === 'ALL' || r.projectId?.name === selectedProject;

    return matchesQuery && matchesProject;
  });

  const formatDateRange = (startStr, endStr) => {
    if (!startStr || !endStr) return 'N/A';
    const s = new Date(startStr);
    const e = new Date(endStr);
    const sFormatted = s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const eFormatted = e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${sFormatted} – ${eFormatted}`;
  };

  if (loading) {
    return <PageLoader message="Loading pending review queue..." />;
  }

  if (error && reports.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <ErrorMessage message={error} title="Review Inbox Error" />
        <button
          onClick={() => loadPendingReports()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ==========================================
          HEADER BAR
      ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Review Inbox
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              {reports.length} pending
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Weekly reports submitted by team members requiring manager evaluation.
          </p>
        </div>

        <button
          onClick={() => loadPendingReports(true)}
          disabled={refreshing}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          title="Refresh pending reviews"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* ==========================================
          SEARCH & FILTER BAR
      ========================================== */}
      {reports.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by team member, email, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Project Filter */}
          {uniqueProjects.length > 1 && (
            <div className="sm:w-56">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Projects ({reports.length})</option>
                {uniqueProjects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          PENDING REPORTS LIST
      ========================================== */}
      {reports.length === 0 ? (
        <div className="py-16">
          <EmptyState
            icon={CheckCircle2}
            title="All Caught Up!"
            description="There are currently no weekly reports waiting for manager review."
          />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <p className="text-sm text-slate-400">
            No pending reports matching the current filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedProject('ALL');
            }}
            className="mt-3 text-xs text-brand-400 hover:text-brand-300 font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredReports.map((report) => {
            const totalHours = (report.hours || []).reduce((sum, h) => sum + (h.hours || 0), 0);
            const taskCount = (report.tasks || []).length;
            const completedCount = (report.tasks || []).filter((t) => t.status === 'COMPLETED').length;

            return (
              <div
                key={report._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg shadow-black/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 group"
              >
                {/* Left Side: Member, Project, and Timeline info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Member Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-sm shrink-0 shadow-md shadow-brand-950/40">
                    {report.userId?.name ? report.userId.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {report.userId?.name || 'Unnamed Member'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({report.userId?.email})
                      </span>
                      <ReportStatusBadge status={report.status} size="sm" />
                      {report.currentVersion > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          v{report.currentVersion}
                        </span>
                      )}
                    </div>

                    {/* Project & Reporting Period */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
                        {report.projectId?.name || 'Project'}
                        {report.projectId?.category && (
                          <span className="text-slate-500 text-[11px]">
                            ({report.projectId.category})
                          </span>
                        )}
                      </span>

                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-brand-400" />
                        {formatDateRange(report.weekStart, report.weekEnd)}
                      </span>

                      {report.submittedAt && (
                        <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          Submitted {new Date(report.submittedAt).toLocaleDateString()} at{' '}
                          {new Date(report.submittedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    {/* Brief Summary Badges */}
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>
                        Tasks: <strong className="text-slate-200">{completedCount}/{taskCount} done</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Hours: <strong className="text-teal-300">{totalHours}h</strong>
                      </span>
                      {report.blockers?.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">
                            {report.blockers.length} blocker(s)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Primary Review Action */}
                <div className="flex items-center self-end md:self-center shrink-0">
                  <Link
                    to={`/reviews/${report._id}`}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-brand-600/20 transition-all flex items-center gap-2 group-hover:scale-105"
                  >
                    <span>Review Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
