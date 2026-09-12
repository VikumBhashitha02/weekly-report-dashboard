import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  FolderGit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  FileText,
  Link as LinkIcon,
  Edit3,
  Send,
  Trash2,
  History,
  User,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import reportService from '../../services/reportService';
import { useToast } from '../../hooks/useToast';
import ReportStatusBadge from '../../components/reports/ReportStatusBadge';
import PageLoader from '../../components/ui/PageLoader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Version snapshot modal/drawer inspector
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // Action Modals State
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  // Load report and version history
  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportRes, versionsRes] = await Promise.all([
        reportService.getReportById(id),
        reportService.getReportVersions(id).catch(() => ({ data: [] })),
      ]);

      setReport(reportRes?.data || null);
      setVersions(versionsRes?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load report details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Date formatter
  const formatDateRange = (startStr, endStr) => {
    if (!startStr || !endStr) return 'N/A';
    const s = new Date(startStr);
    const e = new Date(endStr);
    const sFormatted = s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const eFormatted = e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${sFormatted} – ${eFormatted}`;
  };

  // Submit Report Action
  const handleSubmitReport = async () => {
    setActionLoading(true);
    try {
      await reportService.submitReport(id);
      toastSuccess('Report submitted for manager review!');
      setShowSubmitConfirm(false);
      await loadReportData();
    } catch (err) {
      toastError(err.message || 'Failed to submit report.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Draft Action
  const handleDeleteDraft = async () => {
    setActionLoading(true);
    try {
      await reportService.deleteReport(id);
      toastSuccess('Draft report deleted.');
      setShowDeleteConfirm(false);
      navigate('/reports', { replace: true });
    } catch (err) {
      toastError(err.message || 'Failed to delete report.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading weekly report details..." />;
  }

  if (error && !report) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <ErrorMessage message={error} title="Report Error" />
        <Link
          to="/reports"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Reports</span>
        </Link>
      </div>
    );
  }

  const isDraft = report?.status === 'DRAFT';
  const isNeedsCorrection = report?.status === 'NEEDS_CORRECTION';
  const isSubmitted = report?.status === 'SUBMITTED';
  const isApproved = report?.status === 'APPROVED';

  const totalHours = (report?.hours || []).reduce((acc, h) => acc + (h.hours || 0), 0);
  const completedTasks = (report?.tasks || []).filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/reports"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="Back to reports list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {report?.projectId?.name || 'Project Report'}
              </h1>
              <ReportStatusBadge status={report?.status} size="md" />
            </div>
            <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              <span>{formatDateRange(report?.weekStart, report?.weekEnd)}</span>
              {report?.currentVersion > 0 && (
                <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Version {report.currentVersion}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {isDraft && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Draft</span>
            </button>
          )}

          {(isDraft || isNeedsCorrection) && (
            <Link
              to={`/reports/${id}/edit`}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isNeedsCorrection ? 'Edit & Correct' : 'Edit Report'}</span>
            </Link>
          )}

          {(isDraft || isNeedsCorrection) && (
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isNeedsCorrection ? 'Resubmit Report' : 'Submit Report'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Manager Feedback Banner (if NEEDS_CORRECTION) */}
      {isNeedsCorrection && report?.latestReviewComment && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1.5 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Manager Correction Requested</span>
          </div>
          <p className="text-xs text-amber-200/90 italic pl-6 leading-relaxed">
            "{report.latestReviewComment}"
          </p>
        </div>
      )}

      {/* Approval Confirmation Banner (if APPROVED) */}
      {isApproved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-center justify-between shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-300 text-sm">Report Approved by Management</p>
              {report?.approvedAt && (
                <p className="text-xs text-emerald-300/80">
                  Approved on {new Date(report.approvedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          {report?.latestReviewComment && (
            <span className="text-xs text-emerald-200 italic hidden md:inline">
              "{report.latestReviewComment}"
            </span>
          )}
        </div>
      )}

      {/* ==========================================
          KPI SUMMARY STRIP
      ========================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Tasks Completed
          </span>
          <p className="text-xl font-bold text-white">
            {completedTasks} <span className="text-sm font-normal text-slate-500">/ {report?.tasks?.length || 0}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Hours
          </span>
          <p className="text-xl font-bold text-teal-300">{totalHours} hrs</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Blockers Reported
          </span>
          <p className={`text-xl font-bold ${report?.blockers?.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {report?.blockers?.length || 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Key Highlights
          </span>
          <p className="text-xl font-bold text-emerald-400">{report?.achievements?.length || 0}</p>
        </div>
      </div>

      {/* ==========================================
          SECTION 1: CURRENT WEEK TASKS
      ========================================== */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Tasks Completed & In Progress</span>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
            {report?.tasks?.length || 0} tasks
          </span>
        </div>

        {(!report?.tasks || report.tasks.length === 0) ? (
          <p className="text-xs text-slate-500 italic py-2">No tasks recorded for this week.</p>
        ) : (
          <div className="space-y-3">
            {report.tasks.map((task, idx) => {
              const priorityColors = {
                LOW: 'text-slate-400 bg-slate-800 border-slate-700',
                MEDIUM: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
                HIGH: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
                URGENT: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
              };

              const statusBadgeStyles = {
                NOT_STARTED: 'text-slate-400 bg-slate-800',
                IN_PROGRESS: 'text-sky-300 bg-sky-500/10',
                COMPLETED: 'text-emerald-300 bg-emerald-500/10',
                BLOCKED: 'text-rose-300 bg-rose-500/10',
              };

              return (
                <div
                  key={task._id || idx}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-500 font-mono">#{idx + 1}</span>
                      <h4 className="text-sm font-semibold text-white">{task.taskName}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          priorityColors[task.priority] || priorityColors.MEDIUM
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          statusBadgeStyles[task.status] || statusBadgeStyles.NOT_STARTED
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Deliverables / Reference */}
                  {task.deliverable && (
                    <p className="text-xs text-brand-300 font-mono bg-brand-500/5 px-2.5 py-1 rounded border border-brand-500/10">
                      Deliverable: {task.deliverable}
                    </p>
                  )}

                  {/* Progress Bars & Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-400">
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>Progress (Planned: {task.plannedPercentage}%)</span>
                        <span className="font-semibold text-slate-200">{task.actualPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, task.actualPercentage || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                      <span>
                        Planned: <strong className="text-slate-200">{task.plannedHours}h</strong>
                      </span>
                      <span>
                        Spent: <strong className="text-teal-300">{task.spentHours}h</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==========================================
          SECTION 2: NEXT WEEK PLANS
      ========================================== */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Calendar className="w-5 h-5 text-sky-400" />
            <span>Planned Tasks for Next Week</span>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
            {report?.nextWeekTasks?.length || 0} planned
          </span>
        </div>

        {(!report?.nextWeekTasks || report.nextWeekTasks.length === 0) ? (
          <p className="text-xs text-slate-500 italic py-2">No planned tasks outlined for next week.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.nextWeekTasks.map((t, idx) => (
              <div
                key={t._id || idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{t.taskName}</span>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    {t.priority}
                  </span>
                </div>
                {t.notes && <p className="text-xs text-slate-400">{t.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==========================================
          SECTION 3: BLOCKERS & ACHIEVEMENTS
      ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blockers */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 font-bold text-white text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Blockers & Challenges</span>
          </div>

          {(!report?.blockers || report.blockers.length === 0) ? (
            <p className="text-xs text-slate-500 italic py-2">No blockers reported.</p>
          ) : (
            <div className="space-y-2.5">
              {report.blockers.map((b, idx) => (
                <div
                  key={b._id || idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    b.isKeyIssue
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{b.title}</span>
                    {b.isKeyIssue && (
                      <span className="text-[10px] font-bold text-rose-400 uppercase bg-rose-500/20 px-2 py-0.5 rounded">
                        Critical
                      </span>
                    )}
                  </div>
                  {b.description && <p className="text-slate-400 leading-relaxed">{b.description}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Achievements */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 font-bold text-white text-sm">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Highlights & Achievements</span>
          </div>

          {(!report?.achievements || report.achievements.length === 0) ? (
            <p className="text-xs text-slate-500 italic py-2">No key achievements specified.</p>
          ) : (
            <div className="space-y-2.5">
              {report.achievements.map((a, idx) => (
                <div
                  key={a._id || idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    a.isKeyAchievement
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{a.title}</span>
                    {a.isKeyAchievement && (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/20 px-2 py-0.5 rounded">
                        Key Milestone
                      </span>
                    )}
                  </div>
                  {a.description && <p className="text-slate-400 leading-relaxed">{a.description}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ==========================================
          SECTION 4: HOURS BREAKDOWN & NOTES
      ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hours Breakdown */}
        <section className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 font-bold text-white text-sm">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Hours Breakdown</span>
          </div>

          {(!report?.hours || report.hours.length === 0) ? (
            <p className="text-xs text-slate-500 italic py-2">No categorized hours breakdown.</p>
          ) : (
            <div className="space-y-2">
              {report.hours.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300">{h.taskType}</span>
                  <span className="font-bold text-teal-300 font-mono">{h.hours} hrs</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notes & Links */}
        <section className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 font-bold text-white text-sm">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Notes & Resource Links</span>
          </div>

          {report?.notes ? (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {report.notes}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No notes provided.</p>
          )}

          {report?.links?.length > 0 && (
            <div className="pt-2 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Attached Links
              </span>
              <div className="flex flex-wrap gap-2">
                {report.links.map((linkStr, i) => (
                  <a
                    key={i}
                    href={linkStr}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-xs text-brand-300 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="truncate max-w-xs">{linkStr}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ==========================================
          SECTION 5: VERSION AUDIT TRAIL
      ========================================== */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <History className="w-5 h-5 text-purple-400" />
            <span>Audit Trail & Historical Versions</span>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
            {versions.length} snapshot(s)
          </span>
        </div>

        {versions.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No submitted version snapshots yet. Version 1 will be generated upon report submission.
          </p>
        ) : (
          <div className="space-y-3">
            {versions.map((ver) => (
              <div
                key={ver._id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-xs font-mono">
                    v{ver.versionNumber}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Version {ver.versionNumber} Snapshot
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Captured on {new Date(ver.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVersion(ver);
                    setShowVersionModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 self-end sm:self-center"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Snapshot</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Modal for Submitting Report */}
      <ConfirmDialog
        isOpen={showSubmitConfirm}
        title="Submit Weekly Report for Review?"
        message="Your report will enter the manager review inbox and snapshot versioning will be created."
        confirmText="Confirm & Submit"
        loading={actionLoading}
        onConfirm={handleSubmitReport}
        onCancel={() => setShowSubmitConfirm(false)}
      />

      {/* Confirmation Modal for Deleting Draft */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Draft Report?"
        message="Are you sure you want to delete this draft? This action cannot be undone."
        confirmText="Delete Draft"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleDeleteDraft}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Historical Version Inspector Modal */}
      {showVersionModal && selectedVersion && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                  Version {selectedVersion.versionNumber}
                </span>
                <h3 className="text-base font-bold text-white">Historical Snapshot Content</h3>
              </div>
              <button
                onClick={() => setShowVersionModal(false)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                <p>
                  <strong>Snapshot Timestamp:</strong>{' '}
                  {new Date(selectedVersion.submittedAt).toLocaleString()}
                </p>
                {selectedVersion.submittedBy && (
                  <p>
                    <strong>Author:</strong> {selectedVersion.submittedBy.name || selectedVersion.submittedBy.email}
                  </p>
                )}
              </div>

              {/* Tasks Snapshot */}
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Tasks at submission:</h4>
                {(selectedVersion.content?.tasks || []).length === 0 ? (
                  <p className="text-slate-500 italic">No tasks in snapshot</p>
                ) : (
                  <div className="space-y-2">
                    {selectedVersion.content.tasks.map((t, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <div className="flex justify-between font-semibold text-slate-200">
                          <span>{t.taskName}</span>
                          <span className="text-brand-400">{t.actualPercentage}%</span>
                        </div>
                        {t.deliverable && <p className="text-slate-400 font-mono">PR: {t.deliverable}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes Snapshot */}
              {selectedVersion.content?.notes && (
                <div>
                  <h4 className="font-semibold text-slate-200 mb-1">Notes at submission:</h4>
                  <p className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    {selectedVersion.content.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setShowVersionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
