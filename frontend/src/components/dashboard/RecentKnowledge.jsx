import React from 'react';
import { FileText, File, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';

export const RecentKnowledge = ({ items = [], onSelectNote, onSelectDoc }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl border border-white/5 text-slate-400 text-sm">
        No recent knowledge items found. Create your first note or upload a document to get started.
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="glass-card rounded-2xl border border-white/8 divide-y divide-white/5 overflow-hidden">
      {items.map((item) => {
        const isNote = item.type === 'note';
        const isPdf = item.type === 'pdf';

        return (
          <div
            key={item.id}
            className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
            onClick={() => (isNote ? onSelectNote?.(item.id) : onSelectDoc?.(item.id))}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isNote
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : isPdf
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isNote ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                  <span className="capitalize">{item.type}</span>
                  <span>•</span>
                  <span>{formatDate(item.date)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Badge variant={item.category}>{item.category || 'General'}</Badge>
              {item.status && (
                <Badge variant={item.status}>
                  {item.status === 'ready' ? 'Ready for AI' : item.status}
                </Badge>
              )}
              <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all hidden sm:block" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default RecentKnowledge;
