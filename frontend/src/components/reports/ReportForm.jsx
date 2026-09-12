import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FolderGit2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Award,
  Clock,
  FileText,
  Link as LinkIcon,
  Plus,
  Trash2,
  Save,
  Send,
  HelpCircle,
} from 'lucide-react';
import ButtonSpinner from '../ui/ButtonSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import ConfirmDialog from '../ui/ConfirmDialog';

// ==========================================
// Zod Validation Schema matching backend
// ==========================================

const taskSchema = z.object({
  taskName: z.string().trim().min(1, 'Task name is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  plannedPercentage: z.coerce.number().min(0).max(100).default(0),
  actualPercentage: z.coerce.number().min(0).max(100).default(0),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).default('NOT_STARTED'),
  plannedHours: z.coerce.number().min(0, 'Planned hours cannot be negative').default(0),
  spentHours: z.coerce.number().min(0, 'Spent hours cannot be negative').default(0),
  deliverable: z.string().trim().default(''),
});

const nextWeekTaskSchema = z.object({
  taskName: z.string().trim().min(1, 'Task name is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  notes: z.string().trim().default(''),
});

const blockerSchema = z.object({
  title: z.string().trim().min(1, 'Blocker title is required'),
  description: z.string().trim().default(''),
  isKeyIssue: z.boolean().default(false),
});

const achievementSchema = z.object({
  title: z.string().trim().min(1, 'Achievement title is required'),
  description: z.string().trim().default(''),
  isKeyAchievement: z.boolean().default(false),
});

const hoursByTypeSchema = z.object({
  taskType: z.string().trim().min(1, 'Task type is required'),
  hours: z.coerce.number().min(0, 'Hours cannot be negative').default(0),
});

const reportFormSchema = z.object({
  projectId: z.string().min(1, 'Please select a project'),
  weekStart: z.string().min(1, 'Week start date is required'),
  weekEnd: z.string().min(1, 'Week end date is required'),
  tasks: z.array(taskSchema).default([]),
  nextWeekTasks: z.array(nextWeekTaskSchema).default([]),
  blockers: z.array(blockerSchema).default([]),
  achievements: z.array(achievementSchema).default([]),
  hours: z.array(hoursByTypeSchema).default([]),
  notes: z.string().trim().default(''),
  links: z.array(z.string().url('Must be a valid URL (e.g. https://github.com/...)')).default([]),
});

// Preset task types for hours breakdown
const COMMON_TASK_TYPES = [
  'Backend Development',
  'Frontend UI',
  'Testing & QA',
  'Code Review',
  'Architecture & Design',
  'DevOps & Deployment',
  'Bug Fixing',
  'Team Collaboration & Meetings',
];

export default function ReportForm({
  initialData = null,
  projects = [],
  mode = 'create', // 'create' | 'edit'
  saving = false,
  submitting = false,
  onSaveDraft,
  onSubmitReport,
}) {
  const [newLinkInput, setNewLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  // Helper to format ISO date to YYYY-MM-DD input
  const formatDateForInput = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
  };

  // Helper for default current week dates (Monday to Sunday)
  const getDefaultWeekDates = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day; // Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  };

  const defaultDates = getDefaultWeekDates();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      projectId: initialData?.projectId?._id || initialData?.projectId || '',
      weekStart: formatDateForInput(initialData?.weekStart) || defaultDates.start,
      weekEnd: formatDateForInput(initialData?.weekEnd) || defaultDates.end,
      tasks: initialData?.tasks || [],
      nextWeekTasks: initialData?.nextWeekTasks || [],
      blockers: initialData?.blockers || [],
      achievements: initialData?.achievements || [],
      hours: initialData?.hours || [],
      notes: initialData?.notes || '',
      links: initialData?.links || [],
    },
  });

  // Dynamic Array Handlers
  const {
    fields: taskFields,
    append: appendTask,
    remove: removeTask,
  } = useFieldArray({ control, name: 'tasks' });

  const {
    fields: nextWeekFields,
    append: appendNextWeek,
    remove: removeNextWeek,
  } = useFieldArray({ control, name: 'nextWeekTasks' });

  const {
    fields: blockerFields,
    append: appendBlocker,
    remove: removeBlocker,
  } = useFieldArray({ control, name: 'blockers' });

  const {
    fields: achievementFields,
    append: appendAchievement,
    remove: removeAchievement,
  } = useFieldArray({ control, name: 'achievements' });

  const {
    fields: hourFields,
    append: appendHour,
    remove: removeHour,
  } = useFieldArray({ control, name: 'hours' });

  const links = watch('links') || [];

  // Add Link
  const handleAddLink = () => {
    setLinkError('');
    if (!newLinkInput.trim()) return;
    try {
      new URL(newLinkInput.trim());
      setValue('links', [...links, newLinkInput.trim()]);
      setNewLinkInput('');
    } catch {
      setLinkError('Please enter a valid URL starting with http:// or https://');
    }
  };

  const handleRemoveLink = (index) => {
    setValue(
      'links',
      links.filter((_, i) => i !== index)
    );
  };

  // Format form values for ISO dates before dispatching
  const formatPayload = (data) => {
    const start = new Date(data.weekStart);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(data.weekEnd);
    end.setUTCHours(23, 59, 59, 999);

    return {
      ...data,
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
    };
  };

  // Draft Save Trigger
  const handleDraftSubmit = (data) => {
    const payload = formatPayload(data);
    onSaveDraft?.(payload);
  };

  // Direct Submit Trigger (opens ConfirmDialog)
  const handleDirectSubmitClick = (data) => {
    const payload = formatPayload(data);
    setPendingFormData(payload);
    setShowSubmitConfirm(true);
  };

  return (
    <>
      <form className="space-y-8" noValidate>
        {/* ==========================================
            1. PROJECT & REPORTING PERIOD
        ========================================== */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-white font-bold text-base">
            <FolderGit2 className="w-5 h-5 text-brand-400" />
            <span>1. Project & Reporting Period</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Project Selector */}
            <div className="md:col-span-1">
              <label htmlFor="report-project" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Assigned Project <span className="text-rose-400">*</span>
              </label>
              <select
                id="report-project"
                disabled={mode === 'edit'}
                aria-invalid={!!errors.projectId}
                className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.projectId
                    ? 'border-rose-500/60 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-brand-500/60 focus:ring-brand-500/20'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                {...register('projectId')}
              >
                <option value="">Select project...</option>
                {projects.map((proj) => (
                  <option key={proj._id} value={proj._id}>
                    {proj.name} ({proj.category || 'General'})
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.projectId.message}</p>
              )}
              {mode === 'edit' && (
                <p className="text-[11px] text-slate-500 mt-1">Project assignment cannot be changed after creation.</p>
              )}
            </div>

            {/* Week Start */}
            <div>
              <label htmlFor="report-week-start" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Week Start Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="report-week-start"
                type="date"
                disabled={mode === 'edit'}
                aria-invalid={!!errors.weekStart}
                className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.weekStart
                    ? 'border-rose-500/60 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-brand-500/60 focus:ring-brand-500/20'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                {...register('weekStart')}
              />
              {errors.weekStart && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.weekStart.message}</p>
              )}
            </div>

            {/* Week End */}
            <div>
              <label htmlFor="report-week-end" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Week End Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="report-week-end"
                type="date"
                disabled={mode === 'edit'}
                aria-invalid={!!errors.weekEnd}
                className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.weekEnd
                    ? 'border-rose-500/60 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-brand-500/60 focus:ring-brand-500/20'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                {...register('weekEnd')}
              />
              {errors.weekEnd && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.weekEnd.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* ==========================================
            2. CURRENT WEEK TASKS
        ========================================== */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>2. Current Week Tasks</span>
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {taskFields.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                appendTask({
                  taskName: '',
                  priority: 'MEDIUM',
                  plannedPercentage: 100,
                  actualPercentage: 100,
                  status: 'COMPLETED',
                  plannedHours: 8,
                  spentHours: 8,
                  deliverable: '',
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {taskFields.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">
              No tasks added yet. Click "+ Add Task" to list your accomplishments for this reporting cycle.
            </p>
          ) : (
            <div className="space-y-4">
              {taskFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                      Task #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTask(idx)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded-lg"
                      title="Remove Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Task Name */}
                    <div className="md:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Task Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Implement user authentication endpoint"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        {...register(`tasks.${idx}.taskName`)}
                      />
                      {errors.tasks?.[idx]?.taskName && (
                        <p className="text-[10px] text-rose-400 mt-1">
                          {errors.tasks[idx].taskName.message}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
                      <select
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        {...register(`tasks.${idx}.status`)}
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Priority</label>
                      <select
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        {...register(`tasks.${idx}.priority`)}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    {/* Progress % (Planned vs Actual) */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Planned % (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        {...register(`tasks.${idx}.plannedPercentage`)}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Actual % (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        {...register(`tasks.${idx}.actualPercentage`)}
                      />
                    </div>

                    {/* Hours (Planned vs Spent) */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Planned Hours</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        {...register(`tasks.${idx}.plannedHours`)}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Spent Hours</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        {...register(`tasks.${idx}.spentHours`)}
                      />
                    </div>

                    {/* Deliverable link / PR reference */}
                    <div className="md:col-span-12">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Deliverable / PR / Branch Reference
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PR #42 (merged to main), Figma mockups v2"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        {...register(`tasks.${idx}.deliverable`)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ==========================================
            3. NEXT WEEK PLANS
        ========================================== */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Calendar className="w-5 h-5 text-sky-400" />
              <span>3. Planned Tasks for Next Week</span>
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {nextWeekFields.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => appendNextWeek({ taskName: '', priority: 'MEDIUM', notes: '' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Planned Task</span>
            </button>
          </div>

          {nextWeekFields.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">
              No planned tasks added. Click "+ Add Planned Task" to outline next week's focus areas.
            </p>
          ) : (
            <div className="space-y-3">
              {nextWeekFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row gap-3 items-start"
                >
                  <div className="flex-1 w-full">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Planned Task <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Integrate Redis caching layer for dashboard stats"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      {...register(`nextWeekTasks.${idx}.taskName`)}
                    />
                    {errors.nextWeekTasks?.[idx]?.taskName && (
                      <p className="text-[10px] text-rose-400 mt-1">
                        {errors.nextWeekTasks[idx].taskName.message}
                      </p>
                    )}
                  </div>

                  <div className="w-full md:w-36">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Priority</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      {...register(`nextWeekTasks.${idx}.priority`)}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div className="flex-1 w-full">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Notes / Dependencies</label>
                    <input
                      type="text"
                      placeholder="e.g. Requires API keys from DevOps"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      {...register(`nextWeekTasks.${idx}.notes`)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeNextWeek(idx)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-2 mt-5 self-end md:self-center"
                    title="Remove Planned Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ==========================================
            4. BLOCKERS & ACHIEVEMENTS
        ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blockers */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Blockers & Challenges</span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {blockerFields.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => appendBlocker({ title: '', description: '', isKeyIssue: false })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Blocker</span>
              </button>
            </div>

            {blockerFields.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3 text-center">No blockers reported this week.</p>
            ) : (
              <div className="space-y-3">
                {blockerFields.map((field, idx) => (
                  <div key={field.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Blocker title (e.g. Third-party API outage)"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        {...register(`blockers.${idx}.title`)}
                      />
                      <button
                        type="button"
                        onClick={() => removeBlocker(idx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {errors.blockers?.[idx]?.title && (
                      <p className="text-[10px] text-rose-400">{errors.blockers[idx].title.message}</p>
                    )}
                    <textarea
                      rows={2}
                      placeholder="Impact description and mitigation steps..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                      {...register(`blockers.${idx}.description`)}
                    />
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                      <input
                        type="checkbox"
                        className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
                        {...register(`blockers.${idx}.isKeyIssue`)}
                      />
                      <span>Flag as Critical / Key Issue</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Achievements */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Highlights & Achievements</span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {achievementFields.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => appendAchievement({ title: '', description: '', isKeyAchievement: false })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Highlight</span>
              </button>
            </div>

            {achievementFields.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3 text-center">No highlights added yet.</p>
            ) : (
              <div className="space-y-3">
                {achievementFields.map((field, idx) => (
                  <div key={field.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Highlight title (e.g. Zero downtime DB migration)"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        {...register(`achievements.${idx}.title`)}
                      />
                      <button
                        type="button"
                        onClick={() => removeAchievement(idx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {errors.achievements?.[idx]?.title && (
                      <p className="text-[10px] text-rose-400">{errors.achievements[idx].title.message}</p>
                    )}
                    <textarea
                      rows={2}
                      placeholder="Details, impact, or stakeholder kudos..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                      {...register(`achievements.${idx}.description`)}
                    />
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                      <input
                        type="checkbox"
                        className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
                        {...register(`achievements.${idx}.isKeyAchievement`)}
                      />
                      <span>Flag as Major Team Achievement</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ==========================================
            5. HOURS BREAKDOWN BY TASK TYPE
        ========================================== */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Clock className="w-5 h-5 text-teal-400" />
              <span>5. Hours Effort Breakdown by Category</span>
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {hourFields.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => appendHour({ taskType: COMMON_TASK_TYPES[0], hours: 8 })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category Hours</span>
            </button>
          </div>

          {hourFields.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">
              No hour breakdown categories added. Click "+ Add Category Hours" to log time spent.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {hourFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Category #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHour(idx)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      list={`task-types-${idx}`}
                      placeholder="Category name"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      {...register(`hours.${idx}.taskType`)}
                    />
                    <datalist id={`task-types-${idx}`}>
                      {COMMON_TASK_TYPES.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                    {errors.hours?.[idx]?.taskType && (
                      <p className="text-[10px] text-rose-400 mt-1">{errors.hours[idx].taskType.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="Hours"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                        {...register(`hours.${idx}.hours`)}
                      />
                      <span className="text-xs text-slate-400 font-medium">hrs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ==========================================
            6. GENERAL NOTES & LINKS
        ========================================== */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-white font-bold text-base">
            <FileText className="w-5 h-5 text-slate-400" />
            <span>6. Notes & Resource Links</span>
          </div>

          <div>
            <label htmlFor="report-notes" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Additional General Notes
            </label>
            <textarea
              id="report-notes"
              rows={3}
              placeholder="Any overall observations, sprint retro feedback, or reminders for leadership..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 resize-none"
              {...register('notes')}
            />
          </div>

          {/* Links */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Relevant Documentation / Pull Request Links
            </label>

            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  placeholder="https://github.com/org/repo/pull/123"
                  value={newLinkInput}
                  onChange={(e) => setNewLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddLink}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Add Link
              </button>
            </div>
            {linkError && <p className="text-xs text-rose-400 mb-2">{linkError}</p>}

            {links.length > 0 && (
              <div className="space-y-1.5 mt-3">
                {links.map((linkStr, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-brand-300"
                  >
                    <a
                      href={linkStr}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:underline max-w-[85%]"
                    >
                      {linkStr}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(i)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==========================================
            ACTIONS FOOTER
        ========================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
          {/* Save Draft Action */}
          <button
            type="button"
            disabled={saving || submitting}
            onClick={handleSubmit(handleDraftSubmit)}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <ButtonSpinner label="Saving Draft..." />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{mode === 'edit' ? 'Save Changes' : 'Save as Draft'}</span>
              </>
            )}
          </button>

          {/* Submit Report Action */}
          {onSubmitReport && (
            <button
              type="button"
              disabled={saving || submitting}
              onClick={handleSubmit(handleDirectSubmitClick)}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-brand-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <ButtonSpinner label="Submitting..." />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Confirmation Modal for Direct Submit */}
      <ConfirmDialog
        isOpen={showSubmitConfirm}
        title="Submit Weekly Report for Review?"
        message="After submission, your report enters manager review and cannot be freely edited unless corrections are requested. An immutable snapshot version will be captured."
        confirmText="Confirm & Submit"
        loading={submitting}
        onConfirm={async () => {
          setShowSubmitConfirm(false);
          if (pendingFormData) {
            onSubmitReport?.(pendingFormData);
          }
        }}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </>
  );
}
