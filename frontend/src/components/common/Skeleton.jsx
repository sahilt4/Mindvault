import React from 'react';

export const SkeletonCard = ({ count = 3, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`glass-card p-5 rounded-2xl border border-white/5 flex flex-col gap-3 skeleton-shimmer ${className}`}
        >
          <div className="h-5 w-2/3 bg-slate-800/80 rounded-md" />
          <div className="h-4 w-full bg-slate-800/50 rounded-md" />
          <div className="h-4 w-4/5 bg-slate-800/50 rounded-md" />
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
            <div className="h-4 w-16 bg-slate-800/80 rounded-full" />
            <div className="h-4 w-20 bg-slate-800/50 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
};

export const SkeletonRow = ({ count = 4 }) => {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="h-12 w-full rounded-xl bg-slate-800/40 border border-white/5 skeleton-shimmer"
        />
      ))}
    </div>
  );
};

export const SkeletonAI = () => {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl glass-card border border-blue-500/20">
      <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
        <span>Searching your knowledge...</span>
      </div>
      <div className="h-4 w-5/6 bg-slate-800/70 rounded-md skeleton-shimmer" />
      <div className="h-4 w-2/3 bg-slate-800/50 rounded-md skeleton-shimmer" />
    </div>
  );
};
