import React from 'react';
import { CheckCircle2, Clock, Eye, Check } from 'lucide-react';

/**
 * ReviewProgressSteps - Pitch-crease inspired video review progression timeline.
 * Steps: Submitted -> Assigned -> Under Review -> Completed
 */
export const ReviewProgressSteps = ({ status, className = '' }) => {
  const norm = (status || '').toLowerCase().replace('-', '_');

  const steps = [
    { key: 'submitted', label: 'Submitted', icon: Clock },
    { key: 'assigned', label: 'Assigned', icon: Eye },
    { key: 'under_review', label: 'Under Review', icon: Clock },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  ];

  let activeIndex = 0;
  if (norm === 'completed') activeIndex = 3;
  else if (norm === 'under_review') activeIndex = 2;
  else if (norm === 'assigned') activeIndex = 1;
  else activeIndex = 0;

  return (
    <div className={`w-full py-2 ${className}`}>
      <div className="relative flex items-center justify-between">
        {/* Connecting pitch crease line */}
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0">
          <div
            className="h-full bg-forest rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step nodes */}
        {steps.map((step, idx) => {
          const isPassed = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isFuture = idx > activeIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isPassed
                    ? 'bg-forest text-white ring-4 ring-white shadow-xs'
                    : isCurrent
                    ? 'bg-gold text-navy-dark ring-4 ring-gold/20 shadow-sm scale-110 animate-pulse'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
                title={step.label}
              >
                {isPassed ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-heading uppercase tracking-wider mt-1.5 transition-colors ${
                  isCurrent
                    ? 'font-bold text-forest'
                    : isPassed
                    ? 'font-semibold text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
