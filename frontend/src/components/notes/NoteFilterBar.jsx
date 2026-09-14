import React from 'react';
import { Search, Plus } from 'lucide-react';
import Button from '../common/Button';

const CATEGORIES = ['All', 'Work', 'College', 'Projects', 'Personal', 'Other'];

export const NoteFilterBar = ({
  search,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onNewNote
}) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Top row: Search input + New Note button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes by title, text, or tags..."
            className="w-full glass-input rounded-xl text-sm pl-10 pr-4 py-2.5 placeholder:text-slate-500"
          />
        </div>

        <Button variant="primary" icon={Plus} onClick={onNewNote} className="shrink-0">
          New Note
        </Button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-white/5'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default NoteFilterBar;
