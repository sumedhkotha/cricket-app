import React from 'react';

export const StatusPill = ({ status, className = '', showDot = true }) => {
  const norm = (status || '').toLowerCase().replace('-', '_');

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200'; // default grey
  let dotClass = 'bg-slate-400';
  let label = status || 'Inactive';

  if (['active', 'completed', 'paid', 'approved'].includes(norm)) {
    bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotClass = 'bg-emerald-500';
  } else if (['assigned', 'pending', 'submitted'].includes(norm)) {
    bgClass = 'bg-amber-50 text-amber-900 border-amber-200';
    dotClass = 'bg-amber-500 animate-pulse';
  } else if (['under_review', 'under review'].includes(norm)) {
    bgClass = 'bg-orange-50 text-orange-900 border-orange-200';
    dotClass = 'bg-orange-500 animate-pulse';
    label = 'Under Review';
  } else if (['inactive', 'failed', 'declined'].includes(norm)) {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
    dotClass = 'bg-rose-500';
  }

  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-wider border shadow-2xs ${bgClass} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotClass} shrink-0`} />}
      <span>{displayLabel}</span>
    </span>
  );
};
