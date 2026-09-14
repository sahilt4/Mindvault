import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle, onClick }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      glow: 'from-blue-600/10 to-transparent'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      glow: 'from-purple-600/10 to-transparent'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'from-emerald-600/10 to-transparent'
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: 'from-amber-600/10 to-transparent'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden glass-card glass-card-hover p-5 rounded-2xl border border-white/8 flex flex-col justify-between group transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-blue-500/30 hover:scale-[1.02] active:scale-[0.98]' : ''
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${scheme.glow} rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50`} />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl ${scheme.bg} ${scheme.border} border flex items-center justify-center ${scheme.text} shadow-sm transition-transform group-hover:scale-110`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="relative z-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {value !== undefined ? value : 0}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
export default StatCard;
