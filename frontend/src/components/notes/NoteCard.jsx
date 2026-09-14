import React from 'react';
import { Edit3, Trash2, Calendar, Tag } from 'lucide-react';
import Badge from '../common/Badge';

export const NoteCard = ({ note, onEdit, onDelete, onOpen }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div
      className="glass-card glass-card-hover rounded-2xl border border-white/8 p-5 flex flex-col justify-between group transition-all"
    >
      <div>
        {/* Header: Category & Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant={note.category}>{note.category || 'Other'}</Badge>
          
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
              title="Edit Note"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note._id);
              }}
              title="Delete Note"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpen?.(note)}
          className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors cursor-pointer mb-2 line-clamp-1"
        >
          {note.title}
        </h3>

        {/* Content Preview */}
        <p
          onClick={() => onOpen?.(note)}
          className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-4 cursor-pointer"
        >
          {note.content}
        </p>
      </div>

      {/* Footer: Tags & Date */}
      <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-6">
            {note.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(note.updatedAt)}</span>
          </div>
          <button
            onClick={() => onOpen?.(note)}
            className="text-blue-400 hover:text-blue-300 font-medium text-xs cursor-pointer"
          >
            Open &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
export default NoteCard;
