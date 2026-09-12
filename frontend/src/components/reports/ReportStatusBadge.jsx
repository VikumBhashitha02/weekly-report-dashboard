import React from 'react';
import { FileEdit, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    icon: FileEdit,
    badgeClass: 'bg-slate-800/90 text-slate-300 border-slate-700/80 shadow-slate-900/30',
    iconClass: 'text-slate-400',
  },
  SUBMITTED: {
    label: 'Submitted / In Review',
    icon: Clock,
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30 shadow-sky-950/30',
    iconClass: 'text-sky-400',
  },
  NEEDS_CORRECTION: {
    label: 'Needs Correction',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-amber-950/30',
    iconClass: 'text-amber-400',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-emerald-950/30',
    iconClass: 'text-emerald-400',
  },
};

export default function ReportStatusBadge({
  status = 'DRAFT',
  size = 'md',
  showIcon = true,
  className = '',
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-sm tracking-wide ${
        sizeClasses[size] || sizeClasses.md
      } ${config.badgeClass} ${className}`}
      role="status"
      aria-label={`Report Status: ${config.label}`}
    >
      {showIcon && <Icon className={`${iconSizes[size] || iconSizes.md} ${config.iconClass} shrink-0`} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}
