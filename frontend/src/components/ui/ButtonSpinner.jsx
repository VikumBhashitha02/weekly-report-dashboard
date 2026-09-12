import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ButtonSpinner({ className = 'w-4 h-4', label = 'Loading...' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  );
}
