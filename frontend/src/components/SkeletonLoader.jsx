import React from 'react';

export const CardSkeleton = ({ count = 3, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="app-card p-6 space-y-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
          </div>
          <div className="h-9 bg-slate-200/80 rounded-full w-full mt-4" />
        </div>
      ))}
    </div>
  );
};

export const ReviewRowSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="app-card p-6 flex flex-col sm:flex-row items-center justify-between gap-5 animate-pulse">
          <div className="flex items-start space-x-4 flex-1 w-full">
            <div className="w-36 sm:w-44 aspect-video rounded-xl bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="h-9 bg-slate-200 rounded-full w-28 shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="app-card p-6 space-y-3 animate-pulse">
          <div className="h-3 bg-slate-200 rounded w-2/3" />
          <div className="h-8 bg-slate-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};
