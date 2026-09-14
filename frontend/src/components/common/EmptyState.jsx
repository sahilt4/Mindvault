import React from 'react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl glass-card border border-dashed border-white/10 ${className}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
