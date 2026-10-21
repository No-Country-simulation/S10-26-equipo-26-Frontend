import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full animate-pulse space-y-3">
      {/* Table header skeleton */}
      <div className="flex gap-4 p-3 bg-slate-900 border-b border-slate-800 rounded-t">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-800 rounded flex-1" />
        ))}
      </div>
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-3 bg-slate-900/40 border-b border-slate-800/60">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className={`h-4 bg-slate-800/80 rounded ${c === 0 ? 'flex-2' : 'flex-1'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
          <div className="h-3 bg-slate-800 rounded w-1/2" />
          <div className="h-7 bg-slate-800 rounded w-3/4" />
          <div className="h-2.5 bg-slate-800 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
};
