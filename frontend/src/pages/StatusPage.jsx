import React, { useEffect, useState } from 'react';
import { healthService } from '../services/healthService';
import { 
  Activity, 
  Server, 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Layers, 
  Code2, 
  ShieldCheck,
  Cpu
} from 'lucide-react';

export default function StatusPage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthService.checkHealth();
      setHealthData(response.data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Unable to connect to backend server');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 selection:bg-teal-500 selection:text-white">
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 font-semibold tracking-wider text-xs uppercase mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Sisenco Digital Assignment
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Weekly Report Generator & Team Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Phase 1: Architecture Foundation & System Verification
            </p>
          </div>

          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            Refresh Status
          </button>
        </header>

        {/* Live System Diagnostics Grid */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            Live System Diagnostics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Frontend Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>
              <h3 className="text-base font-semibold text-white">Frontend Client</h3>
              <p className="text-xs text-slate-400 mt-1">React + Vite + Tailwind CSS</p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex justify-between">
                <span>Port: 5173</span>
                <span>Client Ready</span>
              </div>
            </div>

            {/* Backend API Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                  <Server className="w-6 h-6" />
                </div>
                {healthData ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <XCircle className="w-3.5 h-3.5" /> Offline
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-white">Express Backend API</h3>
              <p className="text-xs text-slate-400 mt-1">Node.js + Express + Zod + JWT</p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex justify-between">
                <span>Port: 5000</span>
                <span>{healthData ? `Uptime: ${healthData.uptime}s` : 'Unreachable'}</span>
              </div>
            </div>

            {/* MongoDB Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Database className="w-6 h-6" />
                </div>
                {healthData?.database?.status === 'connected' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Activity className="w-3.5 h-3.5" /> {healthData?.database?.status || 'Waiting'}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-white">MongoDB Database</h3>
              <p className="text-xs text-slate-400 mt-1">Mongoose ODM Connection</p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex justify-between">
                <span>DB: {healthData?.database?.name || 'team_report_dashboard'}</span>
                <span className="capitalize">{healthData?.database?.status || 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Health Payload Response Preview */}
        <section className="mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Live Response from <code className="text-teal-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">GET /api/health</code>
                </h3>
              </div>
              {lastChecked && (
                <span className="text-xs text-slate-500">Last poll: {lastChecked}</span>
              )}
            </div>

            {loading && !healthData && (
              <div className="flex items-center justify-center p-8 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-teal-400" />
                Connecting to backend API...
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
                <strong>Connection Error:</strong> {error}. Ensure backend is running on port 5000.
              </div>
            )}

            {healthData && (
              <pre className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800/80">
                {JSON.stringify({ success: true, message: "API is healthy and operational", data: healthData }, null, 2)}
              </pre>
            )}
          </div>
        </section>

        {/* Architecture Checklist */}
        <section>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Phase 1 Architecture Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Modular Backend Folder Structure</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Centralized Error Handling & Not Found Middleware</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>CORS & Environment Configurations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Standardized ApiResponse & ApiError Utilities</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Vite + React Router + Tailwind Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Axios Client with Response/Error Interceptors</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-8 mt-8 border-t border-slate-800/80 text-center text-xs text-slate-500">
        Sisenco Digital Technical Assignment &bull; Foundation Layer Ready for Next Phases
      </footer>
    </div>
  );
}
