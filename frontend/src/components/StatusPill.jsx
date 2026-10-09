import React from 'react';

export const StatusPill = ({ status, className = '' }) => {
  const norm = (status || '').toLowerCase().replace('-', '_');

  let bgClass = 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]'; // default grey
  let label = status || 'Inactive';

  if (['active', 'completed', 'paid', 'approved'].includes(norm)) {
    bgClass = 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]';
  } else if (['assigned', 'pending', 'submitted'].includes(norm)) {
    bgClass = 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
  } else if (['under_review', 'under review'].includes(norm)) {
    bgClass = 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]';
    label = 'Under Review';
  } else if (['inactive'].includes(norm)) {
    bgClass = 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
  }

  // Format label to uppercase or capitalized nicely
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${bgClass} ${className}`}
    >
      {displayLabel}
    </span>
  );
};
