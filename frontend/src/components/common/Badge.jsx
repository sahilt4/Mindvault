import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    
    // Category mappings
    Work: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    College: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    Projects: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    Personal: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Other: 'bg-slate-700/30 text-slate-300 border-slate-600/30',

    // Status mappings
    ready: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    processing: 'bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse',
    uploading: 'bg-blue-500/15 text-blue-400 border-blue-500/40 animate-pulse',
    failed: 'bg-red-500/15 text-red-400 border-red-500/40'
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {children}
    </span>
  );
};
export default Badge;
