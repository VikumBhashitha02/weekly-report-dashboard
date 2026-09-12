import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader({ message = 'Loading workspace...' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300"
    >
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-brand-500 animate-spin" />
        <Loader2 className="w-6 h-6 text-brand-500 absolute animate-pulse" />
      </div>
      <p className="text-sm font-medium text-slate-400 animate-pulse">{message}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
}
