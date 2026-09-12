import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FileText, ShieldCheck } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl p-1"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 p-0.5 shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/30 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileText className="w-6 h-6 text-brand-400" />
              </div>
            </div>
            <div className="text-left">
              <span className="block text-lg font-bold text-white tracking-tight leading-none">
                Weekly Report <span className="text-brand-400">Sync</span>
              </span>
              <span className="text-xs font-medium text-slate-400 tracking-wide">
                Sisenco Digital Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Card Shell */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <Outlet />
        </div>

        {/* Footer Meta */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <span>Encrypted Session • Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
}
