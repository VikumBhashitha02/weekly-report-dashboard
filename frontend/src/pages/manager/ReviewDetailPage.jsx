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
  History,
  User,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  RotateCcw,
} from 'lucide-react';
import reportService from '../../services/reportService';
import reviewService from '../../services/reviewService';
import { useToast } from '../../hooks/useToast';
import ReportStatusBadge from '../../components/reports/ReportStatusBadge';
import PageLoader from '../../components/ui/PageLoader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ButtonSpinner from '../../components/ui/ButtonSpinner';

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Dialogs
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveComment, setApproveComment] = useState('');

  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionComment, setCorrectionComment] = useState('');
  const [correctionError, setCorrectionError] = useState('');

  // Version snapshot modal
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportRes, historyRes, versionsRes] = await Promise.all([
        reportService.getReportById(id),
        reviewService.getReviewHistory(id).catch(() => ({ data: [] })),
        reportService.getReportVersions(id).catch(() => ({ data: [] })),
      ]);

      setReport(reportRes?.data || null);
      setReviewHistory(historyRes?.data || []);
      setVersions(versionsRes?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load report for review.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const formatDateRange = (startStr, endStr) => {
    if (!startStr || !endStr) return 'N/A';
    const s = new Date(startStr);
    const e = new Date(endStr);
    const sFormatted = s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const eFormatted = e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${sFormatted} – ${eFormatted}`;
  };

  // ==========================================
  // APPROVE HANDLER
  // ==========================================
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await reviewService.approveReport(id, approveComment.trim());
      setReport(res.data);
      toastSuccess('Report approved successfully!');
      setShowApproveModal(false);
      setApproveComment('');
      // Refresh audit history
      const historyRes = await reviewService.getReviewHistory(id).catch(() => ({ data: [] }));
      setReviewHistory(historyRes.data || []);
    } catch (err) {
      toastError(err.message || 'Failed to approve report.');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // REQUEST CORRECTION HANDLER
  // ==========================================
  const handleRequestCorrection = async (e) => {
    e.preventDefault();
    const comment = correctionComment.trim();

    if (!comment) {
      setCorrectionError('Feedback comment is required when requesting corrections.');
      return;
    }

    setCorrectionError('');
    setActionLoading(true);
    try {
      const res = await reviewService.requestCorrection(id, comment);
      setReport(res.data);
      toastSuccess('Correction request submitted to team member.');
      setShowCorrectionModal(false);
      setCorrectionComment('');
      // Refresh audit history
      const historyRes = await reviewService.getReviewHistory(id).catch(() => ({ data: [] }));
      setReviewHistory(historyRes.data || []);
    } catch (err) {
      toastError(err.message || 'Failed to request correction.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading report review interface..." />;
  }

  if (error && !report) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <ErrorMessage message={error} title="Review Load Error" />
        <Link
          to="/reviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Review Inbox</span>
        </Link>
      </div>
    );
  }

  const isSubmitted = report?.status === 'SUBMITTED';
  const isApproved = report?.status === 'APPROVED';
  const isNeedsCorrection = report?.status === 'NEEDS_CORRECTION';
  const isDraft = report?.status === 'DRAFT';

  const totalHours = (report?.hours || []).reduce((acc, h) => acc + (h.hours || 0), 0);
  const completedTasks = (report?.tasks || []).filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ==========================================
          TOP ACTION & STATUS BAR
      ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/reviews"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="Back to review inbox"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Review: {report?.projectId?.name || 'Weekly Report'}
              </h1>
              <ReportStatusBadge status={report?.status} size="md" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <User className="w-3.5 h-3.5 text-brand-400" />
                {report?.userId?.name || 'Team Member'} ({report?.userId?.email})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {formatDateRange(report?.weekStart, report?.weekEnd)}
              </span>
              {report?.currentVersion > 0 && (
                <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Version {report.currentVersion}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Manager Action Buttons (Only active when SUBMITTED) */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {isSubmitted && (
            <>
              <button
                type="button"
                onClick={() => {
                  setCorrectionError('');
                  setShowCorrectionModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-rose-500/30 hover:bg-rose-500/10 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Request Correction</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Approve Report</span>
              </button>
            </>
          )}

          {!isSubmitted && (
            <Link
              to="/reviews"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Back to Inbox
            </Link>
          )}
        </div>
      </div>

      {/* ==========================================
          STATUS BANNERS
      ========================================== */}
      {isApproved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-center justify-between shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-300 text-sm">Report Approved</p>
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

      {isNeedsCorrection && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1.5 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Correction Requested from Team Member</span>
          </div>
          {report?.latestReviewComment && (
            <p className="text-xs text-amber-200/90 italic pl-6 leading-relaxed">
              "{report.latestReviewComment}"
            </p>
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
            Key Achievements
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
        {/* Hours */}
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
          SECTION 5: REVIEW AUDIT TIMELINE
      ========================================== */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <MessageSquare className="w-5 h-5 text-brand-400" />
            <span>Manager Evaluation & Review Log</span>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
            {reviewHistory.length} review event(s)
          </span>
        </div>

        {reviewHistory.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No manager reviews have been recorded for this report yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reviewHistory.map((rev) => {
              const isApprovedAction = rev.action === 'APPROVED';
              return (
                <div
                  key={rev._id}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    isApprovedAction
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200'
                      : 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                          isApprovedAction
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {isApprovedAction ? 'Approved' : 'Correction Requested'}
                      </span>
                      <span className="text-slate-400">by</span>
                      <span className="font-semibold text-white">
                        {rev.reviewerId?.name || 'Manager'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {rev.comment && (
                    <p className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-200 italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==========================================
          SECTION 6: VERSION SNAPSHOT HISTORY
      ========================================== */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <History className="w-5 h-5 text-purple-400" />
            <span>Submission Version History</span>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
            {versions.length} version snapshot(s)
          </span>
        </div>

        {versions.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No version snapshots recorded for this report.
          </p>
        ) : (
          <div className="space-y-3">
            {versions.map((ver) => (
              <div
                key={ver._id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
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
                      Submitted on {new Date(ver.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVersion(ver);
                    setShowVersionModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Snapshot</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==========================================
          MODAL: APPROVE REPORT
      ========================================== */}
      {showApproveModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Approve Weekly Report?</h3>
                <p className="text-xs text-slate-400">
                  This will mark the submission as approved and finalize the review.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="approveComment" className="block text-xs font-medium text-slate-300 mb-1.5">
                Approval Comment (Optional)
              </label>
              <textarea
                id="approveComment"
                rows={3}
                placeholder="Great work this week on the milestones..."
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                {actionLoading && <ButtonSpinner />}
                <span>Confirm Approval</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: REQUEST CORRECTION
      ========================================== */}
      {showCorrectionModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Request Correction / Revisions</h3>
                <p className="text-xs text-slate-400">
                  Provide detailed feedback explaining what the team member needs to update.
                </p>
              </div>
            </div>

            <form onSubmit={handleRequestCorrection} className="space-y-4">
              <div>
                <label htmlFor="correctionFeedback" className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Correction Instructions <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="correctionFeedback"
                  rows={4}
                  required
                  placeholder="Please clarify the spent hours on task #2 and update the deliverable link..."
                  value={correctionComment}
                  onChange={(e) => {
                    setCorrectionComment(e.target.value);
                    if (correctionError) setCorrectionError('');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-xs text-slate-200 placeholder-slate-600 focus:outline-none ${
                    correctionError
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                {correctionError && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{correctionError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2"
                >
                  {actionLoading && <ButtonSpinner />}
                  <span>Submit Correction Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: VERSION SNAPSHOT VIEWER
      ========================================== */}
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
