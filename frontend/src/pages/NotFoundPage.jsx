import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function NotFoundPage() {
  const { user } = useAuth();
  const homeRoute = user ? (user.role === 'MANAGER_ADMIN' ? '/dashboard' : '/reports') : '/login';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md text-center bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-sky-950/40">
          <FileQuestion className="w-8 h-8" aria-hidden="true" />
        </div>

        <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
          404 Not Found
        </span>

        <h1 className="text-xl font-bold text-white mt-4 mb-2">Page Not Found</h1>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The requested page could not be located. It may have been moved or does not exist.
        </p>

        <Link
          to={homeRoute}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-brand-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Return to Workspace</span>
        </Link>
      </div>
    </div>
  );
}
