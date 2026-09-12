import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const homeRoute = user?.role === 'MANAGER_ADMIN' ? '/dashboard' : '/reports';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md text-center bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-950/40">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>

        <span className="text-xs font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
          403 Forbidden
        </span>

        <h1 className="text-xl font-bold text-white mt-4 mb-2">Access Restricted</h1>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          You do not have permission to view this resource. This section requires higher operational privileges.
        </p>

        {user && (
          <div className="mb-6 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-left flex items-center justify-between">
            <span>Current Role:</span>
            <span className="font-semibold text-brand-300 font-mono">{user.role}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to={homeRoute}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
