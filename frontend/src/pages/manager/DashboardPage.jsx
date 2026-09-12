import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FolderGit2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import dashboardService from '../../services/dashboardService';
import PageLoader from '../../components/ui/PageLoader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../hooks/useToast';

/**
 * Custom Dark Tooltip for Recharts
 */
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-1.5 z-50">
        <p className="font-bold text-white text-sm border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold font-mono text-slate-200">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search filter for team summary
  const [memberSearch, setMemberSearch] = useState('');

  const { error: toastError } = useToast();

  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [statsRes, trendRes, membersRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getWeeklyTrend(8),
        dashboardService.getMemberSummary(),
      ]);

      setStats(statsRes?.data || null);
      setTrend(trendRes?.data || []);
      setMembers(membersRes?.data || []);
    } catch (err) {
      const msg = err.message || 'Failed to load dashboard analytics.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return <PageLoader message="Compiling executive team analytics..." />;
  }

  if (error && !stats) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <ErrorMessage message={error} title="Analytics Error" />
        <button
          onClick={() => loadDashboardData()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const reportsSummary = stats?.reports || { total: 0, byStatus: {} };
  const byStatus = reportsSummary.byStatus || {};
  const pendingCount = byStatus.SUBMITTED || 0;
  const approvedCount = byStatus.APPROVED || 0;
  const correctionCount = byStatus.NEEDS_CORRECTION || 0;
  const draftCount = byStatus.DRAFT || 0;

  // Filter members
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ==========================================
          HEADER BAR
      ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Manager Overview & Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time team throughput, submission velocity, and pending review queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {pendingCount > 0 && (
            <Link
              to="/reviews"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Review Inbox</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950/20 text-slate-950 text-[10px] font-extrabold">
                {pendingCount}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ==========================================
          KPI SUMMARY CARDS
      ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Reviews */}
        <Link
          to="/reviews"
          className="group p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-900/90 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-lg shadow-amber-950/20 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-amber-200 tracking-tight">
              {pendingCount}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>Awaiting manager review</span>
              <ArrowRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </Link>

        {/* Card 2: Approved Reports */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-slate-900/90 border border-emerald-500/20 shadow-lg shadow-emerald-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Approved
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-300 tracking-tight">
              {approvedCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {reportsSummary.total > 0
                ? `${Math.round((approvedCount / reportsSummary.total) * 100)}% of all reports`
                : '0% total'}
            </p>
          </div>
        </div>

        {/* Card 3: Needs Correction */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-slate-900/80 to-slate-900/90 border border-rose-500/20 shadow-lg shadow-rose-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
              Needs Correction
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-rose-300 tracking-tight">
              {correctionCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Returned for revisions</p>
          </div>
        </div>

        {/* Card 4: Total Submissions & Projects */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-500/10 via-slate-900/80 to-slate-900/90 border border-brand-500/20 shadow-lg shadow-brand-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">
              Total Reports
            </span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {reportsSummary.total}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Across <strong className="text-slate-200">{stats?.projects?.active || 0}</strong> active projects
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================
          SECONDARY KPI STRIP
      ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/projects"
          className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Projects</p>
              <p className="text-base font-bold text-white">
                {stats?.projects?.active || 0} <span className="text-xs text-slate-500">active / {stats?.projects?.total || 0} total</span>
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/team"
          className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Team Directory</p>
              <p className="text-base font-bold text-white">
                {stats?.users?.active || 0} <span className="text-xs text-slate-500">active / {stats?.users?.total || 0} total</span>
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Draft Reports</p>
              <p className="text-base font-bold text-slate-300">
                {draftCount} <span className="text-xs text-slate-500">in preparation</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          CHART SECTION: WEEKLY SUBMISSION TREND
      ========================================== */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6 shadow-xl shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Weekly Submission Velocity</h2>
              <p className="text-xs text-slate-400">
                Weekly report volume and review status breakdown over the past 8 weeks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Submitted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Needs Correction
            </span>
          </div>
        </div>

        {trend.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={TrendingUp}
              title="No Historical Trend Data"
              description="Weekly reports submitted by your team will automatically generate trend analytics here."
            />
          </div>
        ) : (
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-xs text-slate-400 capitalize">{value}</span>}
                />
                <Bar
                  dataKey="approved"
                  name="Approved"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  stackId="reports"
                />
                <Bar
                  dataKey="submitted"
                  name="Submitted (In Review)"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  stackId="reports"
                />
                <Bar
                  dataKey="needsCorrection"
                  name="Needs Correction"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  stackId="reports"
                />
                <Bar
                  dataKey="draft"
                  name="Drafts"
                  fill="#475569"
                  radius={[4, 4, 0, 0]}
                  stackId="reports"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ==========================================
          TEAM MEMBER PERFORMANCE SUMMARY
      ========================================== */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6 shadow-xl shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Team Member Summary</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Individual submission output, approval rates, and latest activity
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member name or email..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {members.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={Users}
              title="No Team Member Activity"
              description="Team members will be listed here as soon as they create and submit weekly reports."
            />
          </div>
        ) : filteredMembers.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-8 italic">
            No team members matching "{memberSearch}"
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Total Reports</th>
                  <th className="py-3 px-4 text-center">Approved</th>
                  <th className="py-3 px-4 text-center">Pending Review</th>
                  <th className="py-3 px-4 text-center">Needs Correction</th>
                  <th className="py-3 px-4 text-right">Latest Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.map((m) => (
                  <tr key={m.userId} className="hover:bg-slate-800/40 transition-colors">
                    {/* Member info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-xs shrink-0">
                          {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{m.name || 'Unnamed'}</div>
                          <div className="text-[11px] text-slate-400">{m.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {m.role}
                      </span>
                    </td>

                    {/* Total Reports */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                      {m.totalReports}
                    </td>

                    {/* Approved */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {m.approvedReports}
                      </span>
                    </td>

                    {/* Pending */}
                    <td className="py-3.5 px-4 text-center">
                      {m.submittedReports > 0 ? (
                        <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                          {m.submittedReports}
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>

                    {/* Needs Correction */}
                    <td className="py-3.5 px-4 text-center">
                      {m.needsCorrectionReports > 0 ? (
                        <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                          {m.needsCorrectionReports}
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>

                    {/* Last Report Date */}
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {m.lastReportDate ? (
                        <span className="flex items-center justify-end gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(m.lastReportDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">Never</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
