import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, AlertCircle, FolderGit2 } from 'lucide-react';
import reportService from '../../services/reportService';
import projectService from '../../services/projectService';
import { useToast } from '../../hooks/useToast';
import ReportForm from '../../components/reports/ReportForm';
import PageLoader from '../../components/ui/PageLoader';
import ErrorMessage from '../../components/ui/ErrorMessage';

export default function CreateReportPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  // Load user's assigned active projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await projectService.getProjects();
        setProjects(res?.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load assigned projects. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Save Draft Action
  const handleSaveDraft = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      await reportService.createReport(formData);
      toastSuccess('Report draft saved successfully!');
      navigate('/reports', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save report draft. Please check form inputs.');
      toastError(err.message || 'Error saving draft');
    } finally {
      setSaving(false);
    }
  };

  // Submit Report Action (Creates draft & immediately submits)
  const handleSubmitReport = async (formData) => {
    setSubmitting(true);
    setError(null);
    try {
      const createRes = await reportService.createReport(formData);
      const newReportId = createRes?.data?._id;
      if (newReportId) {
        await reportService.submitReport(newReportId);
        toastSuccess('Report created and submitted for manager review!');
        navigate('/reports', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to submit weekly report.');
      toastError(err.message || 'Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading assigned projects and form..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/reports"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          aria-label="Back to reports list"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Create Weekly Report
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Document completed tasks, next week plans, blockers, and hours for your assigned project.
          </p>
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <ErrorMessage
          message={error}
          title="Submission Error"
          onDismiss={() => setError(null)}
        />
      )}

      {/* No Assigned Projects Alert */}
      {projects.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">No Projects Assigned</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You must be assigned to at least one active project by a manager before submitting weekly reports.
          </p>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Reports</span>
          </Link>
        </div>
      ) : (
        /* Report Form */
        <ReportForm
          mode="create"
          projects={projects}
          saving={saving}
          submitting={submitting}
          onSaveDraft={handleSaveDraft}
          onSubmitReport={handleSubmitReport}
        />
      )}
    </div>
  );
}
