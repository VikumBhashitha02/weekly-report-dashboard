import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Eye, ShieldAlert } from 'lucide-react';
import reportService from '../../services/reportService';
import projectService from '../../services/projectService';
import { useToast } from '../../hooks/useToast';
import ReportForm from '../../components/reports/ReportForm';
import PageLoader from '../../components/ui/PageLoader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ReportStatusBadge from '../../components/reports/ReportStatusBadge';

export default function EditReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  // Load report and projects
  useEffect(() => {
    const fetchReportAndProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const [reportRes, projectsRes] = await Promise.all([
          reportService.getReportById(id),
          projectService.getProjects(),
        ]);

        setReport(reportRes?.data || null);
        setProjects(projectsRes?.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load report data.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportAndProjects();
  }, [id]);

  // Handle Save Draft / Updates
  const handleSaveDraft = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      await reportService.updateReport(id, formData);
      toastSuccess('Report changes saved successfully!');
      navigate(`/reports/${id}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to update report.');
      toastError(err.message || 'Error updating report');
    } finally {
      setSaving(false);
    }
  };

  // Handle Resubmit Report
  const handleSubmitReport = async (formData) => {
    setSubmitting(true);
    setError(null);
    try {
      await reportService.updateReport(id, formData);
      await reportService.submitReport(id);
      toastSuccess('Report updated and resubmitted for manager review!');
      navigate(`/reports/${id}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to submit report changes.');
      toastError(err.message || 'Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading report for editing..." />;
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

  // Check state eligibility for editing
  const isEditable = report?.status === 'DRAFT' || report?.status === 'NEEDS_CORRECTION';

  if (!isEditable) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Report Cannot Be Edited</h2>
        <p className="text-sm text-slate-400">
          This report currently has status <ReportStatusBadge status={report?.status} size="sm" /> and is locked from direct edits.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/reports"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Back to List
          </Link>
          <Link
            to={`/reports/${id}`}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Read-Only Report</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={`/reports/${id}`}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="Back to report details"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Edit Weekly Report
              </h1>
              <ReportStatusBadge status={report?.status} size="sm" />
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Make adjustments to your weekly tasks, hours breakdown, and notes.
            </p>
          </div>
        </div>
      </div>

      {/* Manager Feedback Callout if NEEDS_CORRECTION */}
      {report?.status === 'NEEDS_CORRECTION' && report?.latestReviewComment && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1.5 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Requested Corrections from Manager</span>
          </div>
          <p className="text-xs text-amber-200/90 italic pl-6 leading-relaxed">
            "{report.latestReviewComment}"
          </p>
        </div>
      )}

      {/* Error Callout */}
      {error && (
        <ErrorMessage
          message={error}
          title="Update Error"
          onDismiss={() => setError(null)}
        />
      )}

      {/* Reusable Form in Edit Mode */}
      <ReportForm
        mode="edit"
        initialData={report}
        projects={projects}
        saving={saving}
        submitting={submitting}
        onSaveDraft={handleSaveDraft}
        onSubmitReport={handleSubmitReport}
      />
    </div>
  );
}
