import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

export default function ErrorMessage({
  message,
  errors = [],
  title = 'An error occurred',
  onDismiss,
  className = '',
}) {
  if (!message && (!errors || errors.length === 0)) return null;

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 space-y-1">
          {title && <p className="font-semibold text-rose-200">{title}</p>}
          {message && <p className="text-rose-300">{message}</p>}
          {errors.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 mt-2 text-xs text-rose-300/90">
              {errors.map((err, idx) => (
                <li key={idx}>
                  {err.field ? <span className="font-medium text-rose-200">{err.field}: </span> : null}
                  {err.message}
                </li>
              ))}
            </ul>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-rose-400 hover:text-rose-200 transition-colors p-1 rounded-lg"
            aria-label="Dismiss error"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
